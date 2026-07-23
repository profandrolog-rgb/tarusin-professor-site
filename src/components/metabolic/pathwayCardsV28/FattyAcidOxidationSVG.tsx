import { PathwayCardSVG, type PathwaySchemeProps } from "./PathwayCardSVG";

/**
 * FattyAcidOxidationSVG — статическая SVG-карточка «Окисление жирных кислот и дикарбоновые кислоты» (fatty_acid_oxidation).
 * Коды, data-node-id, роли и биоматериал сверены с клинической матрицей v2.8.
 * Рёбра типизированы атрибутами data-edge-id/data-from/data-to по Dependencies v2.8.
 * Компонент только отображает values/status; клиническую severity не вычисляет.
 */

const SVG_MARKUP = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1060 440" width="100%" height="auto" font-family="PT Sans,Arial">
<style>
.ttl{font:600 20px "PT Sans",Arial,sans-serif;fill:#1f2d33}
.sub{font:400 12px "PT Sans",Arial,sans-serif;fill:#5a6b73}
.nm{font:500 12px "PT Sans",Arial,sans-serif;fill:#1f2d33;text-anchor:middle}
.code{font:600 9px "PT Sans",Arial,sans-serif;fill:#8a95b8;text-anchor:start}
.val{font:700 11px "PT Sans",Arial,sans-serif;fill:#1f2d33;text-anchor:middle}
.cyc{fill:#eef5f4;stroke:#4a7a86;stroke-width:2;vector-effect:non-scaling-stroke}
.ctx{fill:#f5f1fa;stroke:#9a8bb0;stroke-width:1.8;stroke-dasharray:6 3;vector-effect:non-scaling-stroke}
.ar{stroke:#7f9aa2;stroke-width:1.8;fill:none;vector-effect:non-scaling-stroke}
.leg{font:400 11px "PT Sans",Arial,sans-serif;fill:#5a6b73}
.tagU{fill:#E9A23B} .tagB{fill:#4478C4}
.tagT{font:700 9px "PT Sans",Arial,sans-serif;fill:#fff;text-anchor:middle}
</style>
<defs><marker id="__ARROW_ID__" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1.5 1.5L8 5L1.5 8.5" fill="none" stroke="context-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>
<rect width="1060" height="440" fill="#fff"/>
<text class="ttl" x="30" y="40">Окисление жирных кислот и дикарбоновые кислоты</text>
<text class="sub" x="30" y="60">fatty_acid_oxidation · связи по слою зависимостей · М=моча К=кровь · severity не начисляется</text>
<g class="graph" transform="translate(110 0)">
<g><rect class="ctx" data-node-id="ethylmalonate" x="120" y="150" width="160" height="60" rx="11"/><text class="code" x="128" y="164">EMA</text><circle class="tagU" cx="266" cy="164" r="8"/><text class="tagT" x="266" y="167">М</text><text class="nm" x="200" y="186">Этилмалоновая кислота</text></g>
<g><rect class="ctx" data-node-id="methylsuccinate" x="340" y="150" width="160" height="60" rx="11"/><text class="code" x="348" y="164">MSA</text><circle class="tagU" cx="486" cy="164" r="8"/><text class="tagT" x="486" y="167">М</text><text class="nm" x="420" y="186">Метилянтарная кислота</text></g>
<g><rect class="cyc" data-node-id="glutarate" x="560" y="150" width="160" height="60" rx="11"/><text class="code" x="568" y="164">GA</text><circle class="tagU" cx="706" cy="164" r="8"/><text class="tagT" x="706" y="167">М</text><text class="nm" x="640" y="186">Глутаровая кислота</text></g>
<g><rect class="ctx" data-node-id="sebacate" x="560" y="280" width="160" height="60" rx="11"/><text class="code" x="568" y="294">SEBAC</text><circle class="tagU" cx="706" cy="294" r="8"/><text class="tagT" x="706" y="297">М</text><text class="nm" x="640" y="316">Себациновая кислота</text></g>
<g><rect class="ctx" data-node-id="adipate" x="340" y="280" width="160" height="60" rx="11"/><text class="code" x="348" y="294">ADIP</text><circle class="tagU" cx="486" cy="294" r="8"/><text class="tagT" x="486" y="297">М</text><text class="nm" x="420" y="316">Адипиновая кислота</text></g>
<g><rect class="ctx" data-node-id="suberate" x="120" y="280" width="160" height="60" rx="11"/><text class="code" x="128" y="294">SUBER</text><circle class="tagU" cx="266" cy="294" r="8"/><text class="tagT" x="266" y="297">М</text><text class="nm" x="200" y="316">Субериновая кислота</text></g>
</g>
<text class="leg" x="30" y="428">Обводка = статус: <tspan fill="#3f7d4f">норма</tspan> · <tspan fill="#E0A800">лёгкое</tspan> · <tspan fill="#E8730C">умеренное</tspan> · <tspan fill="#C0392B">выраженное</tspan> · <tspan fill="#9aa0a6">нет данных</tspan></text>
</svg>`;

export default function FattyAcidOxidationSVG(props: PathwaySchemeProps) {
  return <PathwayCardSVG markup={SVG_MARKUP} {...props} />;
}
