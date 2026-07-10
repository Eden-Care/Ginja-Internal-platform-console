#!/usr/bin/env python3
"""Generate API_REFERENCE.md from the Ginja Platform Console OpenAPI spec.

Usage:
    # fetch the live dev spec and regenerate the doc at repo root:
    curl -s https://dev-api.ginja.ai/internal-platform/api/v1/v3/api-docs -o api-docs.json
    python3 scripts/gen-api-reference.py api-docs.json API_REFERENCE.md

Args (both optional):
    argv[1]  path to the OpenAPI JSON        (default: api-docs.json)
    argv[2]  path to write the markdown to   (default: API_REFERENCE.md)
"""
import json, re, sys

SPEC_PATH = sys.argv[1] if len(sys.argv) > 1 else 'api-docs.json'
OUT_PATH = sys.argv[2] if len(sys.argv) > 2 else 'API_REFERENCE.md'

SPEC = json.load(open(SPEC_PATH))
OUT = []
def w(s=''): OUT.append(s)

def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

def ref_name(ref):
    return ref.split('/')[-1]

def schema_anchor(name):
    return '#schema-' + slug(name)

def dedupe(seq):
    seen, out = set(), []
    for x in seq:
        if x not in seen:
            seen.add(x); out.append(x)
    return out

def type_str(sch):
    if sch is None:
        return ''
    if '$ref' in sch:
        n = ref_name(sch['$ref'])
        return f'[`{n}`]({schema_anchor(n)})'
    t = sch.get('type')
    if t == 'array':
        items = sch.get('items', {})
        return f'array&lt;{type_str(items)}&gt;'
    fmt = sch.get('format')
    base = t or ('object' if 'properties' in sch else '')
    if fmt:
        base = f'{base} ({fmt})'
    enum = sch.get('enum')
    if enum:
        vals = ', '.join(f'`{v}`' for v in dedupe(enum))
        base = (base + ' enum' if base else 'enum') + f': {vals}'
    return base or 'object'

def esc(s):
    if s is None: return ''
    return str(s).replace('\n', ' ').replace('|', '\\|').strip()

def props_table(schema):
    props = schema.get('properties')
    if not props:
        return None
    required = set(schema.get('required', []))
    lines = ['| Field | Type | Req | Description |', '|---|---|---|---|']
    for name, p in props.items():
        req = '✓' if name in required else ''
        desc = esc(p.get('description', ''))
        ex = p.get('example')
        if ex is not None and not isinstance(ex, (dict, list)):
            desc = (desc + f' _(e.g. `{ex}`)_').strip()
        lines.append(f'| `{name}` | {type_str(p)} | {req} | {desc} |')
    return lines

info = SPEC['info']
w(f"# {info['title']}")
w()
w(f"> Auto-generated reference for the Ginja Platform Console backend "
  f"(OpenAPI `{SPEC['openapi']}`, API version `{info.get('version')}`).")
w(f"> Source spec: `https://dev-api.ginja.ai/internal-platform/api/v1/v3/api-docs` · "
  f"Swagger UI: `/internal-platform/api/v1/swagger-ui/index.html`")
w(f"> Regenerate with `python3 scripts/gen-api-reference.py api-docs.json API_REFERENCE.md`.")
w()
w(info['description'].strip())
w()

servers = SPEC.get('servers', [])
if servers:
    w('## Servers')
    w()
    w('| URL | Description |')
    w('|---|---|')
    for s in servers:
        w(f"| `{s.get('url','')}` | {esc(s.get('description',''))} |")
    w()

schemes = SPEC.get('components', {}).get('securitySchemes', {})
if schemes:
    w('## Authentication')
    w()
    for name, sc in schemes.items():
        bits = [f"**`{name}`**", f"type `{sc.get('type')}`"]
        if sc.get('scheme'): bits.append(f"scheme `{sc['scheme']}`")
        if sc.get('bearerFormat'): bits.append(f"format `{sc['bearerFormat']}`")
        w('- ' + ' · '.join(bits))
        if sc.get('description'):
            w(f"  - {esc(sc['description'])}")
    w()
    w('All endpoints require this scheme unless noted otherwise (the `/dev/token` helper is open in the dev profile).')
    w()

tags = SPEC.get('tags', [])
tag_order = [t['name'] for t in tags]
tag_desc = {t['name']: t.get('description', '') for t in tags}

buckets = {name: [] for name in tag_order}
extra_tag_order = []
METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head']
for path, ops in SPEC['paths'].items():
    for method in METHODS:
        if method not in ops:
            continue
        op = ops[method]
        optags = op.get('tags') or ['(untagged)']
        tg = optags[0]
        if tg not in buckets:
            buckets[tg] = []
            extra_tag_order.append(tg)
        buckets[tg].append((method.upper(), path, op))

all_tags = tag_order + extra_tag_order

w('## Contents')
w()
for tg in all_tags:
    if not buckets.get(tg):
        continue
    w(f'- [{tg}](#{slug(tg)}) ({len(buckets[tg])})')
w('- [Schemas](#schemas)')
w()
w('---')
w()

for tg in all_tags:
    items = buckets.get(tg)
    if not items:
        continue
    w(f'## {tg}')
    w()
    if tag_desc.get(tg):
        w(f'_{esc(tag_desc[tg])}_')
        w()
    w('| Method | Path | Summary |')
    w('|---|---|---|')
    for method, path, op in items:
        w(f"| `{method}` | `{path}` | {esc(op.get('summary',''))} |")
    w()
    for method, path, op in items:
        w(f'### `{method}` `{path}`')
        w()
        if op.get('summary'):
            w(f"**{op['summary']}**")
            w()
        if op.get('operationId'):
            w(f"`operationId: {op['operationId']}`")
            w()
        if op.get('description'):
            w(op['description'].strip())
            w()
        params = op.get('parameters', [])
        if params:
            w('**Parameters**')
            w()
            w('| Name | In | Req | Type | Description |')
            w('|---|---|---|---|---|')
            for prm in params:
                req = '✓' if prm.get('required') else ''
                w(f"| `{prm['name']}` | {prm.get('in','')} | {req} | "
                  f"{type_str(prm.get('schema'))} | {esc(prm.get('description',''))} |")
            w()
        rb = op.get('requestBody')
        if rb:
            content = rb.get('content', {})
            jc = content.get('application/json') or next(iter(content.values()), {})
            sch = jc.get('schema', {})
            req_flag = ' (required)' if rb.get('required') else ''
            if '$ref' in sch:
                rn = ref_name(sch['$ref'])
                w(f"**Request body**{req_flag}: [`{rn}`]({schema_anchor(rn)})")
                w()
                tbl = props_table(SPEC['components']['schemas'].get(rn, {}))
                if tbl:
                    for l in tbl: w(l)
                    w()
            else:
                w(f"**Request body**{req_flag}: `{type_str(sch)}`")
                w()
                tbl = props_table(sch)
                if tbl:
                    for l in tbl: w(l)
                    w()
        resp = op.get('responses', {})
        if resp:
            w('**Responses**')
            w()
            w('| Status | Description |')
            w('|---|---|')
            for code, r in resp.items():
                w(f"| `{code}` | {esc(r.get('description',''))} |")
            w()
            for code, r in resp.items():
                if not code.startswith('2'):
                    continue
                content = r.get('content', {})
                for ct, cc in content.items():
                    ex = cc.get('example')
                    if ex is not None:
                        w(f'<details><summary>Example <code>{code}</code> response</summary>')
                        w()
                        w('```json')
                        w(json.dumps(ex, indent=2))
                        w('```')
                        w()
                        w('</details>')
                        w()
                        break
                else:
                    continue
                break
        w('---')
        w()

w('## Schemas')
w()
schemas = SPEC['components']['schemas']
for name in sorted(schemas.keys()):
    sch = schemas[name]
    w(f'### {name}')
    w(f'<a id="schema-{slug(name)}"></a>')
    w()
    if sch.get('description'):
        w(esc(sch['description']))
        w()
    if sch.get('enum'):
        w('Enum: ' + ', '.join(f'`{v}`' for v in dedupe(sch['enum'])))
        w()
    tbl = props_table(sch)
    if tbl:
        for l in tbl: w(l)
        w()
    elif not sch.get('enum'):
        w(f'_Type: {type_str(sch)}_')
        w()

open(OUT_PATH, 'w').write('\n'.join(OUT) + '\n')
n_ops = sum(1 for p in SPEC['paths'].values() for m in p if m in METHODS)
print(f'wrote {OUT_PATH}  ({len(OUT)} lines, {n_ops} operations, {len(schemas)} schemas)')
