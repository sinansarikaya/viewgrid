# ViewGrid Screenshots

Drop your official screenshot images here:
- `workspace.png` or `workspace.webp` (Recommended: 1280x800 or 1920x1080)
- `compare.png` or `compare.webp`
- `issues.png` or `issues.webp`
- `frames.png` or `frames.webp`

Then simply configure the file path in `website/src/data/site.config.ts`:
```ts
export const screenshots = [
  { id: 'workspace', file: '/screenshots/workspace.png', ... }
];
```
If a file is empty or missing, the website automatically displays an interactive stylized vector preview card without breaking the layout or causing Cumulative Layout Shift (CLS).
