"""Extract audited ModChipDef constructor defaults from the installed executable.

This is a build-specific static analysis recipe, not a general C++ decompiler.
It refuses unknown executable hashes; values come from decoded instructions,
not from user observations or per-perk overrides.
"""
import argparse, hashlib, json, pathlib, struct, sys
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'work/tools/python-packages'))
import pefile
from capstone import Cs, CS_ARCH_X86, CS_MODE_64
from capstone.x86 import X86_OP_IMM, X86_OP_MEM

parser=argparse.ArgumentParser()
parser.add_argument('--exe',default=r'C:\Program Files (x86)\Steam\steamapps\common\Aliens Fireteam Elite 2\AFE2\Binaries\Win64\AFE2-Win64-Shipping.exe')
parser.add_argument('--output',default=str(ROOT/'data/native/mod-chip-defaults.json'))
args=parser.parse_args()
binary=pathlib.Path(args.exe).read_bytes()
digest=hashlib.sha256(binary).hexdigest()
EXPECTED='3493d7ce83c4c9dcd45d2466c1c02c2d4e69bf20ffb862ef3380ee8c96cfb93c'
if digest!=EXPECTED: raise RuntimeError('Unknown executable build: audit its native constructor before extracting defaults')
pe=pefile.PE(data=binary,fast_load=True)
image_base=pe.OPTIONAL_HEADER.ImageBase
def read(rva,size):
    offset=pe.get_offset_from_rva(rva)
    return binary[offset:offset+size]
def require(condition,message):
    if not condition: raise RuntimeError(message)
md=Cs(CS_ARCH_X86,CS_MODE_64);md.detail=True
start,end=0x21c0fb0,0x21c1463
code=read(start,end-start)
require(hashlib.sha256(code).hexdigest()=='788c0fcd949aa3f776ab7994cd6f7c3f0007b3cca39f15486b8b50bfe85ccac2','Constructor changed')
instructions={i.address:i for i in md.disasm(code,start)}
def ins(rva,mnemonic):
    i=instructions[rva]
    require(i.mnemonic==mnemonic,f'Unexpected instruction at {rva:#x}')
    return i
def immediate_store(rva,base,displacement):
    i=ins(rva,'mov');a,b=i.operands
    require(a.type==X86_OP_MEM and i.reg_name(a.mem.base)==base and a.mem.disp==displacement and b.type==X86_OP_IMM,'Unexpected default store')
    return b.imm

# Reflected FArrayPropertyParams: name pointer and member offset.
descriptor=0x58d5c18
name_va=struct.unpack('<Q',read(descriptor,8))[0]
require(read(name_va-image_base,len(b'PossibleShapes\0'))==b'PossibleShapes\0','Property descriptor mismatch')
member_offset=struct.unpack('<I',read(descriptor+36,4))[0]
array_lea=ins(0x21c1224,'lea')
require(array_lea.reg_name(array_lea.operands[0].reg)=='r12' and array_lea.operands[1].mem.disp==member_offset,'Constructor array is not PossibleShapes')
width=immediate_store(0x21c131e,'rsp',0x30)
height=immediate_store(0x21c1326,'rsp',0x34)
require(width>1 and height>1,'Audited constructor branches no longer apply')
require(ins(0x21c1387,'mov').operands[1].mem.disp==0x30,'Width register source changed')
require(ins(0x21c138c,'movsxd').operands[1].mem.disp==0x34,'Height register source changed')

# The audited constructor initializes an int array to zero, then stores four
# occupied cells at origin, +1 row, +1 column, and +1 column/+1 row.
# Decode the actual memory expressions and immediates, preserving mask values.
mask=[0]*(width*height)
registers={'r14':0,'rbp':height,'rcx':height+1}
stores=[0x21c139a,0x21c13a6,0x21c13b8,0x21c13cb]
for rva in stores:
    i=ins(rva,'mov');destination,source=i.operands
    require(destination.type==X86_OP_MEM and source.type==X86_OP_IMM,'Unexpected mask store')
    mem=destination.mem
    offset=registers[i.reg_name(mem.base)]+mem.disp
    if mem.index: offset+=registers[i.reg_name(mem.index)]*mem.scale
    require(offset%4==0 and 0<=offset//4<len(mask),'Mask store outside allocated shape')
    mask[offset//4]=source.imm
require(all(mask),'Audited four-cell constructor did not fill its rectangle')
require(ins(0x21c142e,'mov').operands[0].mem.disp==0x10,'Shape Width member changed')
require(ins(0x21c1432,'mov').operands[0].mem.disp==0x14,'Shape Height member changed')

result={
    'schemaVersion':1,'buildId':'26090957','classPath':'/Script/Endeavor.ModChipDef',
    'source':{'kind':'native_constructor_static_analysis','executableSha256':digest,
      'constructorRva':hex(start),'constructorEndRva':hex(end),
      'constructorSha256':hashlib.sha256(code).hexdigest(),
      'possibleShapesDescriptorRva':hex(descriptor),'possibleShapesMemberOffset':hex(member_offset),
      'widthStoreRva':hex(0x21c131e),'heightStoreRva':hex(0x21c1326),
      'maskStoreRvas':[hex(x) for x in stores]},
    'properties':{'PossibleShapes':[{'Width':width,'Height':height,'CollisionMask':mask}]},
    'scope':'Constructor PossibleShapes default only. Other native properties and post-load behavior are not yet decoded.',
    'coordinateOrder':{'value':'column_major','evidence':'Constructor uses height as the column stride when filling the shape.'}
}
destination=pathlib.Path(args.output);destination.parent.mkdir(parents=True,exist_ok=True)
destination.write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
print(f'Extracted native PossibleShapes: {width}x{height}, mask {mask}, member offset {member_offset:#x}')
print(f'Executable SHA256 verified: {digest}')
