import { PathwayCardSVG, type PathwaySchemeProps } from "./PathwayCardSVG";

/**
 * SulfurOneCarbonSVG — статическая SVG-карточка «Серосодержащие аминокислоты и транссульфурация» (sulfur_one_carbon).
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
<text class="ttl" x="30" y="40">Серосодержащие аминокислоты и транссульфурация</text>
<text class="sub" x="30" y="60">sulfur_one_carbon · связи по слою зависимостей · М=моча К=кровь · severity не начисляется</text>
<line class="ar" data-edge-id="DEP_033" data-from="methionine" data-to="s_adenosylhomocysteine" data-direction="→" data-relation="реакция" x1="284.0" y1="180.0" x2="556.0" y2="180.0" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_034" data-from="s_adenosylhomocysteine" data-to="homocystine" data-direction="→" data-relation="реакция" x1="724.0" y1="180.0" x2="776.0" y2="180.0" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_035" data-from="homocystine" data-to="cystathionine" data-direction="→" data-relation="реакция" x1="860.0" y1="214.0" x2="860.0" y2="276.0" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_036" data-from="cystathionine" data-to="cystine" data-direction="→" data-relation="реакция" x1="776.0" y1="310.0" x2="504.0" y2="310.0" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_037" data-from="cystathionine" data-to="cysteine_sulfate" data-direction="→" data-relation="реакция" x1="776.0" y1="310.0" x2="724.0" y2="310.0" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_038" data-from="cysteine_sulfate" data-to="taurine" data-direction="→" data-relation="реакция" x1="582.5" y1="276.0" x2="477.5" y2="214.0" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_074" data-from="homocystine" data-to="methionine" data-direction="→" data-relation="межпутевая" x1="776.0" y1="180.0" x2="284.0" y2="180.0" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_107" data-from="s_adenosylhomocysteine" data-to="homocysteine_s" data-direction="→" data-relation="реакция" x1="556.0" y1="204.8" x2="284.0" y2="285.2" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_108" data-from="homocysteine_s" data-to="cystathionine" data-direction="→" data-relation="реакция" x1="284.0" y1="310.0" x2="776.0" y2="310.0" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_109" data-from="homocysteine_s" data-to="homocystine" data-direction="→" data-relation="реакция" x1="284.0" y1="293.5" x2="776.0" y2="196.5" marker-end="url(#__ARROW_ID__)"/>
<g><rect class="cyc" data-node-id="methionine" x="120" y="150" width="160" height="60" rx="11"/><text class="code" x="128" y="164">AA_MET_PL</text><circle class="tagB" cx="266" cy="164" r="8"/><text class="tagT" x="266" y="167">К</text><text class="nm" x="200" y="186">Метионин</text></g>
<g><rect class="ctx" data-node-id="taurine" x="340" y="150" width="160" height="60" rx="11"/><text class="code" x="348" y="164">AA_TAU_PL</text><circle class="tagB" cx="486" cy="164" r="8"/><text class="tagT" x="486" y="167">К</text><text class="nm" x="420" y="186">Таурин</text></g>
<g><rect class="cyc" data-node-id="s_adenosylhomocysteine" x="560" y="150" width="160" height="60" rx="11"/><text class="code" x="568" y="164">AA_SAH_PL</text><circle class="tagB" cx="706" cy="164" r="8"/><text class="tagT" x="706" y="167">К</text><text class="nm" x="640" y="186">S-Аденозилгомоцистеин</text></g>
<g><rect class="ctx" data-node-id="homocystine" x="780" y="150" width="160" height="60" rx="11"/><text class="code" x="788" y="164">AA_HCY2_PL</text><circle class="tagB" cx="926" cy="164" r="8"/><text class="tagT" x="926" y="167">К</text><text class="nm" x="860" y="186">Гомоцистин</text></g>
<g><rect class="cyc" data-node-id="cystathionine" x="780" y="280" width="160" height="60" rx="11"/><text class="code" x="788" y="294">AA_CYSTATH_PL</text><circle class="tagB" cx="926" cy="294" r="8"/><text class="tagT" x="926" y="297">К</text><text class="nm" x="860" y="316">Цистатионин</text></g>
<g><rect class="ctx" data-node-id="cysteine_sulfate" x="560" y="280" width="160" height="60" rx="11"/><text class="code" x="568" y="294">AA_CYS_SO4_PL</text><circle class="tagB" cx="706" cy="294" r="8"/><text class="tagT" x="706" y="297">К</text><text class="nm" x="640" y="316">Цистеин-сульфат</text></g>
<g><rect class="cyc" data-node-id="cystine" x="340" y="280" width="160" height="60" rx="11"/><text class="code" x="348" y="294">AA_CYSTINE_PL</text><circle class="tagB" cx="486" cy="294" r="8"/><text class="tagT" x="486" y="297">К</text><text class="nm" x="420" y="316">Цистин</text></g>
<g><rect class="cyc" data-node-id="homocysteine_s" x="120" y="280" width="160" height="60" rx="11"/><text class="code" x="128" y="294">HCY</text><circle class="tagB" cx="266" cy="294" r="8"/><text class="tagT" x="266" y="297">К</text><text class="nm" x="200" y="316">Гомоцистеин</text></g>
<text class="leg" x="30" y="428">Обводка = статус: <tspan fill="#3f7d4f">норма</tspan> · <tspan fill="#E0A800">лёгкое</tspan> · <tspan fill="#E8730C">умеренное</tspan> · <tspan fill="#C0392B">выраженное</tspan> · <tspan fill="#9aa0a6">нет данных</tspan></text>
</svg>`;

export default function SulfurOneCarbonSVG(props: PathwaySchemeProps) {
  return <PathwayCardSVG markup={SVG_MARKUP} {...props} />;
}
