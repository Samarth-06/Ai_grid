/**
 * Vite plugin: stamp every JSX opening element with `data-src-file` and
 * `data-src-line` attributes so the in-app capture script can map screen
 * regions back to specific source files and lines.
 *
 * Ships into each generated app's `tools/` directory; loaded by `vite.config.ts`.
 *
 * Implementation note: this file ships as plain ESM JavaScript (no bundling).
 * It depends on `@babel/core`, which is always present in a Vite + React app
 * via `@vitejs/plugin-react`'s transitive deps — so no extra installs needed.
 * Earlier we tried bundling babel into a self-contained file with esbuild;
 * that fails at runtime because Vite ESM-wraps `vite.config.ts` and the
 * generated `__require` shim can't dynamically require Node built-ins.
 */

import * as babel from '@babel/core';
import path from 'node:path';

const { transformSync, types: t } = babel;

const SRC_FILE_ATTR = 'data-src-file';
const SRC_LINE_ATTR = 'data-src-line';

function sourceLocBabelPlugin() {
  return {
    visitor: {
      JSXOpeningElement(nodePath, state) {
        const node = nodePath.node;
        const loc = node.loc;
        if (!loc) return;

        const already = node.attributes.some(
          (attr) =>
            attr.type === 'JSXAttribute' &&
            attr.name?.type === 'JSXIdentifier' &&
            attr.name.name === SRC_FILE_ATTR
        );
        if (already) return;

        const filename = state.file?.opts?.filename || '';
        const relFile = path
          .relative(process.cwd(), filename)
          .split('?')[0]
          .split(path.sep)
          .join('/');

        node.attributes.push(
          t.jsxAttribute(t.jsxIdentifier(SRC_FILE_ATTR), t.stringLiteral(relFile)),
          t.jsxAttribute(t.jsxIdentifier(SRC_LINE_ATTR), t.stringLiteral(String(loc.start.line)))
        );
      },
    },
  };
}

export default function sourceLocPlugin() {
  return {
    name: 'pentoggle:source-loc',
    enforce: 'pre',
    transform(code, id) {
      const cleanId = id.split('?')[0];
      if (!/\.(jsx|tsx)$/.test(cleanId)) return null;
      if (id.includes('/node_modules/')) return null;

      try {
        const result = transformSync(code, {
          filename: id,
          babelrc: false,
          configFile: false,
          plugins: [sourceLocBabelPlugin],
          parserOpts: { plugins: ['jsx', 'typescript'] },
          sourceMaps: true,
          ast: false,
        });
        if (!result?.code) return null;
        return { code: result.code, map: result.map };
      } catch {
        // If transformation fails (parse error, edge case), pass code through
        // unchanged so the app still builds without source-loc attributes.
        return null;
      }
    },
  };
}
