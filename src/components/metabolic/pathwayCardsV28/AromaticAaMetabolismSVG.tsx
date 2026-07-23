import { PathwayCardSVG, type PathwaySchemeProps } from "./PathwayCardSVG";

/**
 * AromaticAaMetabolismSVG — статическая SVG-карточка «Фенилаланин и тирозин» (aromatic_aa_metabolism).
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
<text class="ttl" x="30" y="40">Фенилаланин и тирозин</text>
<text class="sub" x="30" y="60">aromatic_aa_metabolism · связи по слою зависимостей · М=моча К=кровь · severity не начисляется</text>
<g class="graph" transform="translate(110 0)">
<line class="ar" data-edge-id="DEP_021" data-from="phenylalanine" data-to="tyrosine" data-direction="→" data-relation="реакция" x1="284.0" y1="180.0" x2="336.0" y2="180.0" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_022" data-from="tyrosine" data-to="p_hydroxyphenylpyruvate" data-direction="→" data-relation="реакция" x1="477.5" y1="214.0" x2="582.5" y2="276.0" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_023" data-from="p_hydroxyphenylpyruvate" data-to="homogentisate" data-direction="→" data-relation="реакция" x1="556.0" y1="310.0" x2="504.0" y2="310.0" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_024" data-from="p_hydroxyphenylpyruvate" data-to="p_hydroxyphenyllactate" data-direction="→" data-relation="реакция" x1="556.0" y1="310.0" x2="284.0" y2="310.0" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_025" data-from="phenylalanine" data-to="phenyllactate" data-direction="→" data-relation="реакция" x1="284.0" y1="180.0" x2="556.0" y2="180.0" marker-end="url(#__ARROW_ID__)"/>
<g><rect class="cyc" data-node-id="phenylalanine" x="120" y="150" width="160" height="60" rx="11"/><text class="code" x="128" y="164">AA_PHE_PL</text><circle class="tagB" cx="266" cy="164" r="8"/><text class="tagT" x="266" y="167">К</text><text class="nm" x="200" y="186">Фенилаланин</text></g>
<g><rect class="cyc" data-node-id="tyrosine" x="340" y="150" width="160" height="60" rx="11"/><text class="code" x="348" y="164">AA_TYR_PL</text><circle class="tagB" cx="486" cy="164" r="8"/><text class="tagT" x="486" y="167">К</text><text class="nm" x="420" y="186">Тирозин</text></g>
<g><rect class="cyc" data-node-id="phenyllactate" x="560" y="150" width="160" height="60" rx="11"/><text class="code" x="568" y="164">PLA</text><circle class="tagU" cx="706" cy="164" r="8"/><text class="tagT" x="706" y="167">М</text><text class="nm" x="640" y="182">3-Фенилмолочная</text><text class="nm" x="640" y="197">кислота</text></g>
<g><rect class="cyc" data-node-id="p_hydroxyphenylpyruvate" x="560" y="280" width="160" height="60" rx="11"/><text class="code" x="568" y="294">PHPPA</text><circle class="tagU" cx="706" cy="294" r="8"/><text class="tagT" x="706" y="297">М</text><text class="nm" x="640" y="312">пара-Гидроксифени</text><text class="nm" x="640" y="327">лпировиноградная</text></g>
<g><rect class="cyc" data-node-id="homogentisate" x="340" y="280" width="160" height="60" rx="11"/><text class="code" x="348" y="294">HGA</text><circle class="tagU" cx="486" cy="294" r="8"/><text class="tagT" x="486" y="297">М</text><text class="nm" x="420" y="312">Гомогентизиновая</text><text class="nm" x="420" y="327">кислота</text></g>
<g><rect class="cyc" data-node-id="p_hydroxyphenyllactate" x="120" y="280" width="160" height="60" rx="11"/><text class="code" x="128" y="294">PHPLA</text><circle class="tagU" cx="266" cy="294" r="8"/><text class="tagT" x="266" y="297">М</text><text class="nm" x="200" y="312">пара-Гидрокси</text><text class="nm" x="200" y="327">фенилмолочная</text></g>
</g>
<text class="leg" x="30" y="428">Обводка = статус: <tspan fill="#3f7d4f">норма</tspan> · <tspan fill="#E0A800">лёгкое</tspan> · <tspan fill="#E8730C">умеренное</tspan> · <tspan fill="#C0392B">выраженное</tspan> · <tspan fill="#9aa0a6">нет данных</tspan></text>
</svg>`;

export default function AromaticAaMetabolismSVG(props: PathwaySchemeProps) {
  return <PathwayCardSVG markup={SVG_MARKUP} {...props} />;
}
