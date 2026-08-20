# Ship Paste preview in the Reader

Type: task
Status: resolved
Blocked by: 01

## Question

Nothing left to decide on behaviour — fold **A (Caption toggle)** from [How a Paste preview occupies the preview pane](01-how-a-paste-preview-occupies-the-preview-pane.md) into the one `public/` **Reader** (hosted and **Always-on**).

Same GFM + **Term hints** as file preview. Buffer in memory; clear on Load; restore from the control after a **Map list** click. No write to the **Project**. Tests on the seams that are not chrome. Polish is [Visual polish of Paste preview](03-visual-polish-of-paste-preview.md).

## Answer

**A (Caption toggle)** is in the one `public/` **Reader**.

Paste sits in the preview caption, outline navy, disabled until a **Project** is Loaded. The pane is exclusive: Compose is a textarea; Show is GFM + **Term hints** from the Loaded Project. Caption is the file path, or `Paste preview` with Compose / Show. A **Map list** click shows that file; the buffer stays; Paste restores it (Show if the buffer has text). Load clears the buffer. Relative paste links do not resolve against the Readable tree; `http(s)` opens in a new tab. **Take prompt** and **Skip prompt** stay on `selectedRelPath`. No write.

Session + link kinds: [public/paste-preview.js](../../../public/paste-preview.js). Chrome: `public/index.html`, `public/app.js`. Polish: [Visual polish of Paste preview](03-visual-polish-of-paste-preview.md).

## Comments
