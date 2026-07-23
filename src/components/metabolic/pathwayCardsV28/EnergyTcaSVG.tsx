import { PathwayCardSVG, type PathwaySchemeProps } from "./PathwayCardSVG";

/**
 * EnergyTcaSVG — статическая SVG-карточка «Цикл Кребса и энергообеспечение» (energy_tca).
 * Коды, data-node-id, роли и биоматериал сверены с клинической матрицей v2.8.
 * Рёбра типизированы атрибутами data-edge-id/data-from/data-to по Dependencies v2.8.
 * Компонент только отображает values/status; клиническую severity не вычисляет.
 */

const SVG_MARKUP = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1060 720" width="100%" height="auto" font-family="PT Sans,Arial">
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
<rect width="1060" height="720" fill="#fff"/>
<text class="ttl" x="30" y="40">Цикл Кребса и энергообеспечение</text>
<text class="sub" x="30" y="60">energy_tca · связи по слою зависимостей · М=моча К=кровь · severity не начисляется</text>
<g class="graph" transform="translate(60 0)">
<line class="ar" data-edge-id="DEP_001" data-from="citrate_u" data-to="cis_aconitate" data-direction="→" data-relation="реакция" x1="554.0" y1="161.1" x2="598.1" y2="174.8" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_002" data-from="cis_aconitate" data-to="isocitrate" data-direction="→" data-relation="реакция" x1="700.9" y1="234.9" x2="751.2" y2="326.0" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_003" data-from="isocitrate" data-to="alpha_ketoglutarate" data-direction="→" data-relation="реакция" x1="751.2" y1="394.0" x2="700.9" y2="485.1" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_004" data-from="alpha_ketoglutarate" data-to="succinate" data-direction="→" data-relation="реакция" x1="598.1" y1="545.2" x2="554.0" y2="558.9" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_005" data-from="succinate" data-to="fumarate" data-direction="→" data-relation="реакция" x1="386.0" y1="558.9" x2="341.9" y2="545.2" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_006" data-from="fumarate" data-to="malate" data-direction="→" data-relation="реакция" x1="239.1" y1="485.1" x2="188.8" y2="394.0" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_007" data-from="malate" data-to="citrate_u" data-direction="→" data-relation="реакция" x1="215.3" y1="326.0" x2="424.7" y2="169.0" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_008" data-from="succinate" data-to="methylglutarate_2" data-direction="→" data-relation="реакция" x1="451.2" y1="551.0" x2="276.6" y2="234.9" marker-end="url(#__ARROW_ID__)"/>
<g><rect class="cyc" data-node-id="citrate_u" x="390" y="105" width="160" height="60" rx="11"/><text class="code" x="398" y="119">CITR_U</text><circle class="tagU" cx="536" cy="119" r="8"/><text class="tagT" x="536" y="122">М</text><text class="nm" x="470" y="141">Лимонная кислота</text></g>
<g><rect class="cyc" data-node-id="cis_aconitate" x="602" y="171" width="160" height="60" rx="11"/><text class="code" x="610" y="185">ACON</text><circle class="tagU" cx="748" cy="185" r="8"/><text class="tagT" x="748" y="188">М</text><text class="nm" x="682" y="207">цис-Аконитовая кислота</text></g>
<g><rect class="cyc" data-node-id="isocitrate" x="690" y="330" width="160" height="60" rx="11"/><text class="code" x="698" y="344">ISOCIT</text><circle class="tagU" cx="836" cy="344" r="8"/><text class="tagT" x="836" y="347">М</text><text class="nm" x="770" y="366">Изолимонная кислота</text></g>
<g><rect class="cyc" data-node-id="alpha_ketoglutarate" x="602" y="489" width="160" height="60" rx="11"/><text class="code" x="610" y="503">AKG</text><circle class="tagU" cx="748" cy="503" r="8"/><text class="tagT" x="748" y="506">М</text><text class="nm" x="682" y="521">2-Кетоглутаровая</text><text class="nm" x="682" y="536">кислота</text></g>
<g><rect class="cyc" data-node-id="succinate" x="390" y="555" width="160" height="60" rx="11"/><text class="code" x="398" y="569">SUCC</text><circle class="tagU" cx="536" cy="569" r="8"/><text class="tagT" x="536" y="572">М</text><text class="nm" x="470" y="591">Янтарная кислота</text></g>
<g><rect class="cyc" data-node-id="fumarate" x="178" y="489" width="160" height="60" rx="11"/><text class="code" x="186" y="503">FUM</text><circle class="tagU" cx="324" cy="503" r="8"/><text class="tagT" x="324" y="506">М</text><text class="nm" x="258" y="525">Фумаровая кислота</text></g>
<g><rect class="cyc" data-node-id="malate" x="90" y="330" width="160" height="60" rx="11"/><text class="code" x="98" y="344">MAL</text><circle class="tagU" cx="236" cy="344" r="8"/><text class="tagT" x="236" y="347">М</text><text class="nm" x="170" y="366">Яблочная кислота</text></g>
<g><rect class="ctx" data-node-id="methylglutarate_2" x="178" y="171" width="160" height="60" rx="11"/><text class="code" x="186" y="185">2MGA</text><circle class="tagU" cx="324" cy="185" r="8"/><text class="tagT" x="324" y="188">М</text><text class="nm" x="258" y="207">2-Метилглутаровая</text></g>
</g>
<text class="leg" x="30" y="708">Обводка = статус: <tspan fill="#3f7d4f">норма</tspan> · <tspan fill="#E0A800">лёгкое</tspan> · <tspan fill="#E8730C">умеренное</tspan> · <tspan fill="#C0392B">выраженное</tspan> · <tspan fill="#9aa0a6">нет данных</tspan></text>
</svg>`;

export default function EnergyTcaSVG(props: PathwaySchemeProps) {
  return <PathwayCardSVG markup={SVG_MARKUP} {...props} />;
}
