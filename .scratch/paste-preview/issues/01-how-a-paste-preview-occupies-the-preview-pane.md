# How a Paste preview occupies the preview pane

Type: prototype
Status: resolved
Blocked by:

## Question

How should a **Paste preview** occupy the existing preview pane so Khaled can paste GFM, see **Term hints** from the Loaded **Project**, and return to a **Map list** file?

Locks are on [Paste markdown into the preview and see Term hints](../map.md): explicit control, textarea source, same GFM + Term hints as file preview, one memory buffer, Map list click shows the file, Take/Skip stay on selection. React to chrome: where the control sits, how compose vs rendered look in the pane, what the caption says.

Cheap, throwaway, several variants. Link the prototype as an asset. Do not ship into `public/` here.

## Answer

**A (Caption toggle).**

Paste sits in the preview caption, outline navy like Skip/Take, disabled until a **Project** is Loaded. The pane is exclusive: either the selected **Map list** file or the **Paste preview**, never both. Caption is the file path, or `Paste preview` with Compose / Show. Compose is a full-pane textarea; Show is the same GFM + **Term hints** column as a file. Map list click shows the file; the buffer stays; Paste restores it. Header stays Load-only. Map-actions stay Skip/Take.

Rejected: **B** (header control, stacked live composer + GFM) splits attention while reading hints. **C** (sidebar control, source | render split) looks like an editor and keeps a file path in the caption while the file is hidden.

Variants as primary source: [prototypes/occupy-preview.js](../prototypes/occupy-preview.js). Run `npm run prototype:paste-preview` → http://127.0.0.1:5422/?variant=A

## Comments

- Prototype (throwaway, not `public/`): `.scratch/paste-preview/prototypes/occupy-preview.html`. Run `npm run prototype:paste-preview` → http://127.0.0.1:5422/?variant=A
