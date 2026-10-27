"""Extract audited ModChipDef classification and eligibility rules for one build.

The output contains code/metadata observations and a documented native-rule
translation. It reads no manual perk observations and refuses unknown binaries.
"""
import argparse, hashlib, json, pathlib, struct, sys
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'work/tools/python-packages'))
import pefile
from capstone import Cs, CS_ARCH_X86, CS_MODE_64

parser=argparse.ArgumentParser()
parser.add_argument('--exe',default=r'C:\Program Files (x86)\Steam\steamapps\common\Aliens Fireteam Elite 2\AFE2\Binaries\Win64\AFE2-Win64-Shipping.exe')
parser.add_argument('--output',default=str(ROOT/'data/native/mod-chip-rules.json'))
args=parser.parse_args()
binary=pathlib.Path(args.exe).read_bytes()
digest=hashlib.sha256(binary).hexdigest()
if digest!='3493d7ce83c4c9dcd45d2466c1c02c2d4e69bf20ffb862ef3380ee8c96cfb93c':
    raise RuntimeError('Unknown executable build; audit native rules before using defaults')
pe=pefile.PE(data=binary,fast_load=True)
base=pe.OPTIONAL_HEADER.ImageBase
def read(rva,size):
    offset=pe.get_offset_from_rva(rva)
    return binary[offset:offset+size]
def require(condition,message):
    if not condition: raise RuntimeError(message)
def descriptor(rva,name):
    name_va=struct.unpack('<Q',read(rva,8))[0]
    require(read(name_va-base,len(name)+1)==name.encode()+b'\0',f'Wrong descriptor for {name}')
    return struct.unpack('<I',read(rva+36,4))[0]
def enum_values(entries):
    result={}
    for rva,expected in entries:
        name_va,value=struct.unpack('<Qq',read(rva,16))
        require(read(name_va-base,len(expected)+1)==expected.encode()+b'\0','Enum metadata changed')
        result[expected.split('::')[-1]]=value
    return result
md=Cs(CS_ARCH_X86,CS_MODE_64)
ctor=list(md.disasm(read(0x21c0fb0,0x4b3),0x21c0fb0))
text={i.address:f'{i.mnemonic} {i.op_str}' for i in ctor}
fields={name:descriptor(rva,name) for name,rva in {
    'Type':0x58d5648,'RestrictionType':0x58d5cd8,'RoleRestriction':0x58d5d80,
    'OriginKit':0x58d5db8,'KitRestriction':0x58d5e58,
    'AlternativeKitsAllowed':0x58d5ec8,'ModifierCompatability':0x58d57a0,'Modifiers':0x58d58d8,
    'GrantedAbilityOverride':0x58d57d0
}.items()}
require(fields['Type']==0x1f8 and fields['RestrictionType']==0x478,'Member offsets changed')
require(text[0x21c0fdf]=='xor r13d, r13d','Zero register changed')
require(text[0x21c130c]=='mov word ptr [rbx + 0x1f8], r13w','Core default store changed')
require(text[0x21c1305]=='mov byte ptr [rbx + 0x4e0], r13b','Auto-population default store changed')
type_enum=enum_values([(0x58d84c8,'EModChipType::Core'),(0x58d84d8,'EModChipType::Modifier')])
restriction_enum=enum_values([(0x58d80e8,'EModChipRestrictionType::None'),(0x58d80f8,'EModChipRestrictionType::Role'),(0x58d8108,'EModChipRestrictionType::Kit')])
require(type_enum['Core']==0 and type_enum['Modifier']==1 and restriction_enum['None']==0,'Enum meaning changed')

blocks={
    'constructor':(0x21c0fb0,0x21c1463),
    'isKitAllowed':(0x1eb8620,0x1eb8762),
    'socketRestrictionDispatch':(0x1ec4428,0x1ec4460),
    'modifierTagAutoPopulation':(0x1ebc777,0x1ebc7c8),
    'groupCompatibility':(0x1e9d030,0x1e9d294),
    'perimeterNeighbors':(0x1eb0460,0x1eb0766),
    'possibleSocketGroups':(0x1eb1cb0,0x1eb20c3),
    'anyTagQueryConstructor':(0x3999530,0x39995d6),
    'anyTagQueryEvaluator':(0x3995dd0,0x3995f1c)
}
evidence={name:{'startRva':hex(a),'endRva':hex(b),'sha256':hashlib.sha256(read(a,b-a)).hexdigest()} for name,(a,b) in blocks.items()}
result={
    'schemaVersion':1,'buildId':'26090957','classPath':'/Script/Endeavor.ModChipDef',
    'defaults':{'Type':'Core','RestrictionType':'None','bDoNotAutoPopulateCompatibilityTags':False},
    'enumValues':{'Type':type_enum,'RestrictionType':restriction_enum},
    'memberOffsets':{k:hex(v) for k,v in fields.items()},
    'semantics':{
        'restrictionNone':'Pass the class/role restriction check; other placement/dependency/ownership checks still apply.',
        'restrictionRole':'Compare RoleRestriction with the selected character role; no packaged chip explicitly serializes this restriction in the inspected catalog.',
        'restrictionKit':'Pass when selected class is KitRestriction or its subclass, OR matches any AlternativeKitsAllowed class or its subclass.',
        'originKit':'Not read by IsKitAllowed; preserve as origin/unlock metadata, not an equip restriction.',
        'modifierTagAutoPopulation':'When Type is Modifier and bDoNotAutoPopulateCompatibilityTags is false, append each Modifiers[].ModifierTag.TagName into Tags.',
        'tagCompatibility':'Any core ModifierCompatability tag must equal a modifier effective Tag or one of that Tag\'s dot-separated ancestors.',
        'adjacency':'Orthogonal occupied-cell perimeter neighbors; diagonal-only contact does not connect.',
        'groups':'An adjacent chip identifies a connected group; incoming modifier is tested against that group\'s Core. Compatible modifier chains can therefore reach the core indirectly.',
        'abilityOverrideExclusion':'If incoming modifier has a non-null GrantedAbilityOverride, reject groups already containing any chip with non-null GrantedAbilityOverride.',
        'coreVsModifier':'Core has Type=0 and forms its own group; Modifier has Type=1 and requires a compatible group.'
    },
    'source':{'kind':'native_static_analysis','executableSha256':digest,'blocks':evidence,
        'coreDefaultStoreRva':'0x21c130c','autoPopulationBoolStoreRva':'0x21c1305',
        'restrictionDefault':'No constructor override at native byte0x478; UObject pre-constructor zero initialization gives enum None=0.',
        'zeroInitializationReference':'https://dev.epicgames.com/documentation/unreal-engine/gameplay-classes-in-unreal-engine',
        'isKitAllowedWrapperRva':'0x21c6600','isKitAllowedPredicateRva':'0x1eb8620'},
    'limitations':[
        'This is an audited static translation for this exact executable, not a runtime dump or full decompiler.',
        'Full current acquisition/catalog membership and role-restriction character values are not recovered here.',
        'Shape replacement and multi-group merge edge cases remain additional native research scope; graph reachability captures the observed compatible modifier-chain behavior.'
    ]
}
destination=pathlib.Path(args.output);destination.parent.mkdir(parents=True,exist_ok=True)
destination.write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
print('Extracted native rules: Core / None defaults, class alternatives, modifier tag population, orthogonal group connectivity.')
