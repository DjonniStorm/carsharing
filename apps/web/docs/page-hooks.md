# Page hooks convention

Split page logic into small hooks and pure helpers. Pages stay thin composers.

## Layers

| Layer        | Location                                                              | Responsibility                                       |
| ------------ | --------------------------------------------------------------------- | ---------------------------------------------------- |
| **Load**     | `pages/<domain>/hooks/use-*-load.ts`                                  | Reatom `reset` => `load(id)`, atoms, error redirects |
| **Client**   | `features/<domain>/hooks/` (shared create/edit) or `pages/.../hooks/` | `useState`, refs, UI handlers — no HTTP              |
| **Present**  | `features/<domain>/lib/*-present.ts`                                  | `build*SelectData(t)`, static options — no hooks     |
| **Form lib** | `features/<domain>/lib/*-form.ts` or `*-form-schema.ts`               | parse, validate, snapshot helpers; **Zod** for forms |
| **Mutate**   | `pages/<domain>/hooks/use-*-mutations.ts`                             | submit/save/delete, notifications, navigate          |
| **Composer** | `use-*-page.ts` (optional)                                            | Wire load + client + mutate (~5–15 lines)            |

## Naming

- `use-<screen>-load.ts`, `use-<screen>-mutations.ts`
- `build<Domain><Field>SelectData(t)` in `*-present.ts`

## Where to put hooks

- Reused by create **and** edit => `features/<domain>/hooks/`
- Screen-specific (load lifecycle, save) => `pages/<domain>/hooks/`

## Anti-patterns

- Do not return `typeSelectData` / `drawModeData` from page hooks — call `build*(t)` in the page or section.
- Do not mix form `useState` inside load hooks.

## Lists

Keep thin `useEffect(() => void loadList(), [load])` with Reatom. Extract filters and present builders only.

## Zod (form validation)

Use **Zod** when a submit handler has more than a few manual field checks. Schemas live in `features/<domain>/lib/*-form-schema.ts` (see auth/cars).

| Use Zod                                  | Keep manual                                  |
| ---------------------------------------- | -------------------------------------------- |
| Tariff / violation create forms          | Geozone rules JSON (`parseGeozoneRulesJson`) |
| Geozone meta (name, type, color, preset) | Map geometry / closed ring                   |
| Auth, cars (already)                     | Reatom load, list filters                    |

Flow: `safeParse` in mutate/submit => on failure set `formError` (first issue or mapped `LANG_KEYS`) => on success call API.

## Naming in touched files

When editing a file, prefer meaningful names over single letters:

| Avoid                   | Prefer                      |
| ----------------------- | --------------------------- |
| `catch (e)`             | `catch (error)`             |
| `onChange={(v) => ...}` | `onChange={(value) => ...}` |
| `.map((z) => ...)`      | `.map((zone) => ...)`       |
| `.filter((x) => ...)`   | `.filter((tariff) => ...)`  |
| `ppm`, `pk`, `pp`       | full field names            |

**Exceptions:** `t` from `useTranslation()` / `build*SelectData(t)`; TypeScript generics `T`, `K`.

Do not rename variables across the whole repo in one pass — only in files you change for the task.
