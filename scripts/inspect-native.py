"""Read-only PE string references and bounded x64 disassembly for native-default research."""
import argparse, bisect, json, pathlib, re, struct, sys
root = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / 'work/tools/python-packages'))
import pefile
from capstone import Cs, CS_ARCH_X86, CS_MODE_64

parser = argparse.ArgumentParser()
parser.add_argument('--exe', default=r'C:\Program Files (x86)\Steam\steamapps\common\Aliens Fireteam Elite 2\AFE2\Binaries\Win64\AFE2-Win64-Shipping.exe')
parser.add_argument('--string')
parser.add_argument('--address', type=lambda x:int(x,0))
parser.add_argument('--bytes', type=int, default=800)
args=parser.parse_args()
data=pathlib.Path(args.exe).read_bytes()
pe=pefile.PE(data=data,fast_load=True)
base=pe.OPTIONAL_HEADER.ImageBase
functions=[]
for section in pe.sections:
    if section.Name.rstrip(b'\0')==b'.pdata':
        for start,end,unwind in struct.iter_unpack('<III',section.get_data()[:section.SizeOfRawData//12*12]):
            if start and end: functions.append((base+start,base+end))
functions.sort(); starts=[x[0] for x in functions]
def function(va):
    i=bisect.bisect_right(starts,va)-1
    return functions[i] if i>=0 and va<functions[i][1] else None
def raw_va(offset):
    return base+pe.get_rva_from_offset(offset)
def disassemble(va,count):
    offset=pe.get_offset_from_rva(va-base)
    md=Cs(CS_ARCH_X86,CS_MODE_64)
    for i in md.disasm(data[offset:offset+count],va): print(f'{i.address:#x}: {i.mnemonic:10} {i.op_str}')
if args.string:
    hits=[]
    for encoding in ['utf-16le','ascii']:
        needle=args.string.encode(encoding)+ ('\0'.encode(encoding))
        for match in re.finditer(re.escape(needle),data):
            va=raw_va(match.start()); hits.append(va)
            print('STRING',encoding,hex(va))
    targets=set(hits)
    for section in pe.sections:
        if not section.Characteristics&0x20000000: continue
        code=section.get_data()
        for m in re.finditer(rb'[\x48-\x4f][\x8d\x8b][\x05\x0d\x15\x1d\x25\x2d\x35\x3d]....',code,re.DOTALL):
            va=base+section.VirtualAddress+m.start()
            target=va+7+struct.unpack('<i',m.group()[3:])[0]
            if target in targets: print('CODE_REF',hex(va),'target',hex(target),'function',tuple(hex(x) for x in function(va)) if function(va) else None)
    for target in targets:
        for m in re.finditer(re.escape(struct.pack('<Q',target)),data): print('POINTER_REF',hex(raw_va(m.start())),'target',hex(target))
if args.address:
    bounds=function(args.address)
    print('FUNCTION',tuple(hex(x) for x in bounds) if bounds else None)
    disassemble(args.address,args.bytes)
