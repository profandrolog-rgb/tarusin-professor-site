import { PathwayCardSVG, type PathwaySchemeProps } from "./PathwayCardSVG";

/**
 * BcaaCatabolismSVG — статическая SVG-карточка «Катаболизм BCAA» (bcaa_catabolism).
 * Коды, data-node-id, роли и биоматериал сверены с клинической матрицей v2.8.
 * Рёбра типизированы атрибутами data-edge-id/data-from/data-to по Dependencies v2.8.
 * Компонент только отображает values/status; клиническую severity не вычисляет.
 */

const SVG_MARKUP = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1060 570" width="100%" height="auto" font-family="PT Sans,Arial">
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
<rect width="1060" height="570" fill="#fff"/>
<text class="ttl" x="30" y="40">Катаболизм BCAA</text>
<text class="sub" x="30" y="60">bcaa_catabolism · связи по слою зависимостей · М=моча К=кровь · severity не начисляется</text>
<line class="ar" data-edge-id="DEP_012" data-from="valine" data-to="ketoisovalerate_2" data-direction="→" data-relation="реакция" x1="284.0" y1="180.0" x2="776.0" y2="180.0" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_013" data-from="ketoisovalerate_2" data-to="hydroxy_methylbutyrate_2_3" data-direction="→" data-relation="реакция" x1="776.0" y1="196.5" x2="284.0" y2="293.5" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_014" data-from="leucine" data-to="methyl_oxovalerate_4" data-direction="→" data-relation="реакция" x1="504.0" y1="204.8" x2="776.0" y2="285.2" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_015" data-from="methyl_oxovalerate_4" data-to="isovalerylglycine" data-direction="→" data-relation="реакция" x1="776.0" y1="326.5" x2="284.0" y2="423.5" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_016" data-from="methyl_oxovalerate_4" data-to="methylcrotonylglycine_3" data-direction="→" data-relation="реакция" x1="776.0" y1="334.8" x2="504.0" y2="415.2" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_017" data-from="methylcrotonylglycine_3" data-to="methylglutarate_3" data-direction="→" data-relation="реакция" x1="504.0" y1="440.0" x2="776.0" y2="440.0" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_018" data-from="methyl_oxovalerate_4" data-to="hydroxyisovalerate_3" data-direction="→" data-relation="реакция" x1="802.5" y1="344.0" x2="697.5" y2="406.0" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_019" data-from="isoleucine" data-to="methyl_oxovalerate_3" data-direction="→" data-relation="реакция" x1="640.0" y1="214.0" x2="640.0" y2="276.0" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_020" data-from="isoleucine" data-to="allo_isoleucine" data-direction="→" data-relation="реакция" x1="582.5" y1="214.0" x2="477.5" y2="276.0" marker-end="url(#__ARROW_ID__)"/>
<g><rect class="cyc" data-node-id="valine" x="120" y="150" width="160" height="60" rx="11"/><text class="code" x="128" y="164">AA_VAL_PL</text><circle class="tagB" cx="266" cy="164" r="8"/><text class="tagT" x="266" y="167">К</text><text class="nm" x="200" y="186">Валин</text></g>
<g><rect class="cyc" data-node-id="leucine" x="340" y="150" width="160" height="60" rx="11"/><text class="code" x="348" y="164">AA_LEU_PL</text><circle class="tagB" cx="486" cy="164" r="8"/><text class="tagT" x="486" y="167">К</text><text class="nm" x="420" y="186">Лейцин</text></g>
<g><rect class="cyc" data-node-id="isoleucine" x="560" y="150" width="160" height="60" rx="11"/><text class="code" x="568" y="164">AA_ILE_PL</text><circle class="tagB" cx="706" cy="164" r="8"/><text class="tagT" x="706" y="167">К</text><text class="nm" x="640" y="186">Изолейцин</text></g>
<g><rect class="ctx" data-node-id="ketoisovalerate_2" x="780" y="150" width="160" height="60" rx="11"/><text class="code" x="788" y="164">2KIV</text><circle class="tagU" cx="926" cy="164" r="8"/><text class="tagT" x="926" y="167">М</text><text class="nm" x="860" y="186">2-Кетоизовалериановая</text></g>
<g><rect class="ctx" data-node-id="methyl_oxovalerate_4" x="780" y="280" width="160" height="60" rx="11"/><text class="code" x="788" y="294">4M2OV</text><circle class="tagU" cx="926" cy="294" r="8"/><text class="tagT" x="926" y="297">М</text><text class="nm" x="860" y="312">4-Метил-2-</text><text class="nm" x="860" y="327">оксовалериановая</text></g>
<g><rect class="ctx" data-node-id="methyl_oxovalerate_3" x="560" y="280" width="160" height="60" rx="11"/><text class="code" x="568" y="294">3M2OV</text><circle class="tagU" cx="706" cy="294" r="8"/><text class="tagT" x="706" y="297">М</text><text class="nm" x="640" y="312">3-Метил-2-</text><text class="nm" x="640" y="327">оксовалериановая</text></g>
<g><rect class="ctx" data-node-id="allo_isoleucine" x="340" y="280" width="160" height="60" rx="11"/><text class="code" x="348" y="294">AA_ALLOILE_PL</text><circle class="tagB" cx="486" cy="294" r="8"/><text class="tagT" x="486" y="297">К</text><text class="nm" x="420" y="316">Алло-изолейцин</text></g>
<g><rect class="cyc" data-node-id="hydroxy_methylbutyrate_2_3" x="120" y="280" width="160" height="60" rx="11"/><text class="code" x="128" y="294">2OH3MB</text><circle class="tagU" cx="266" cy="294" r="8"/><text class="tagT" x="266" y="297">М</text><text class="nm" x="200" y="312">2-Гидрокси-3-</text><text class="nm" x="200" y="327">метилбутановая</text></g>
<g><rect class="cyc" data-node-id="isovalerylglycine" x="120" y="410" width="160" height="60" rx="11"/><text class="code" x="128" y="424">IVG</text><circle class="tagU" cx="266" cy="424" r="8"/><text class="tagT" x="266" y="427">М</text><text class="nm" x="200" y="446">Изовалерилглицин</text></g>
<g><rect class="cyc" data-node-id="methylcrotonylglycine_3" x="340" y="410" width="160" height="60" rx="11"/><text class="code" x="348" y="424">3MCG</text><circle class="tagU" cx="486" cy="424" r="8"/><text class="tagT" x="486" y="427">М</text><text class="nm" x="420" y="446">3-Метилкротонилглицин</text></g>
<g><rect class="ctx" data-node-id="hydroxyisovalerate_3" x="560" y="410" width="160" height="60" rx="11"/><text class="code" x="568" y="424">3HIV</text><circle class="tagU" cx="706" cy="424" r="8"/><text class="tagT" x="706" y="427">М</text><text class="nm" x="640" y="442">3-Гидроксиизо</text><text class="nm" x="640" y="457">валериановая</text></g>
<g><rect class="cyc" data-node-id="methylglutarate_3" x="780" y="410" width="160" height="60" rx="11"/><text class="code" x="788" y="424">3MGA</text><circle class="tagU" cx="926" cy="424" r="8"/><text class="tagT" x="926" y="427">М</text><text class="nm" x="860" y="446">3-Метилглутаровая</text></g>
<text class="leg" x="30" y="558">Обводка = статус: <tspan fill="#3f7d4f">норма</tspan> · <tspan fill="#E0A800">лёгкое</tspan> · <tspan fill="#E8730C">умеренное</tspan> · <tspan fill="#C0392B">выраженное</tspan> · <tspan fill="#9aa0a6">нет данных</tspan></text>
</svg>`;

export default function BcaaCatabolismSVG(props: PathwaySchemeProps) {
  return <PathwayCardSVG markup={SVG_MARKUP} {...props} />;
}
