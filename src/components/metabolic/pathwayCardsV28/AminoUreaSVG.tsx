import { PathwayCardSVG, type PathwaySchemeProps } from "./PathwayCardSVG";

/**
 * AminoUreaSVG — статическая SVG-карточка «Цикл мочевины и оротатная ветвь» (amino_urea).
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
<text class="ttl" x="30" y="40">Цикл мочевины и оротатная ветвь</text>
<text class="sub" x="30" y="60">amino_urea · связи по слою зависимостей · М=моча К=кровь · severity не начисляется</text>
<g class="graph" transform="translate(60 0)">
<line class="ar" data-edge-id="DEP_039" data-from="ornithine" data-to="citrulline" data-direction="→" data-relation="реакция" x1="187.9" y1="376.1" x2="225.1" y2="253.7" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_040" data-from="citrulline" data-to="argininosuccinate" data-direction="→" data-relation="реакция" x1="271.6" y1="253.7" x2="564.0" y2="528.7" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_041" data-from="argininosuccinate" data-to="arginine" data-direction="→" data-relation="реакция" x1="610.5" y1="528.7" x2="694.2" y2="253.7" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_042" data-from="arginine" data-to="ornithine" data-direction="→" data-relation="реакция" x1="620.5" y1="250.1" x2="261.5" y2="379.7" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_043" data-from="aspartate" data-to="argininosuccinate" data-direction="→" data-relation="реакция" x1="726.3" y1="444.1" x2="636.3" y2="528.7" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_044" data-from="citrulline" data-to="orotate" data-direction="→" data-relation="реакция" x1="319.5" y1="189.4" x2="386.0" y2="165.3" marker-end="url(#__ARROW_ID__)"/>
<line class="ar" data-edge-id="DEP_045" data-from="ornithine" data-to="homocitrulline" data-direction="→" data-relation="реакция" x1="213.7" y1="444.1" x2="303.7" y2="528.7" marker-end="url(#__ARROW_ID__)"/>
<g><rect class="cyc" data-node-id="orotate" x="390" y="105" width="160" height="60" rx="11"/><text class="code" x="398" y="119">OROT</text><circle class="tagU" cx="536" cy="119" r="8"/><text class="tagT" x="536" y="122">М</text><text class="nm" x="470" y="141">Оротовая кислота</text></g>
<g><rect class="cyc" data-node-id="arginine" x="625" y="190" width="160" height="60" rx="11"/><text class="code" x="633" y="204">AA_ARG_PL</text><circle class="tagB" cx="771" cy="204" r="8"/><text class="tagT" x="771" y="207">К</text><text class="nm" x="705" y="226">Аргинин</text></g>
<g><rect class="cyc" data-node-id="aspartate" x="682" y="380" width="160" height="60" rx="11"/><text class="code" x="690" y="394">AA_ASP_PL</text><circle class="tagB" cx="828" cy="394" r="8"/><text class="tagT" x="828" y="397">К</text><text class="nm" x="762" y="416">Аспарагиновая кислота</text></g>
<g><rect class="cyc" data-node-id="argininosuccinate" x="520" y="533" width="160" height="60" rx="11"/><text class="code" x="528" y="547">AA_ASA_PL</text><circle class="tagB" cx="666" cy="547" r="8"/><text class="tagT" x="666" y="550">К</text><text class="nm" x="600" y="565">Аргининоянтарная</text><text class="nm" x="600" y="580">кислота</text></g>
<g><rect class="ctx" data-node-id="homocitrulline" x="260" y="533" width="160" height="60" rx="11"/><text class="code" x="268" y="547">AA_HCIT_PL</text><circle class="tagB" cx="406" cy="547" r="8"/><text class="tagT" x="406" y="550">К</text><text class="nm" x="340" y="569">Гомоцитруллин</text></g>
<g><rect class="cyc" data-node-id="ornithine" x="98" y="380" width="160" height="60" rx="11"/><text class="code" x="106" y="394">AA_ORN_PL</text><circle class="tagB" cx="244" cy="394" r="8"/><text class="tagT" x="244" y="397">К</text><text class="nm" x="178" y="416">Орнитин</text></g>
<g><rect class="cyc" data-node-id="citrulline" x="155" y="190" width="160" height="60" rx="11"/><text class="code" x="163" y="204">AA_CIT_PL</text><circle class="tagB" cx="301" cy="204" r="8"/><text class="tagT" x="301" y="207">К</text><text class="nm" x="235" y="226">Цитруллин</text></g>
</g>
<text class="leg" x="30" y="708">Обводка = статус: <tspan fill="#3f7d4f">норма</tspan> · <tspan fill="#E0A800">лёгкое</tspan> · <tspan fill="#E8730C">умеренное</tspan> · <tspan fill="#C0392B">выраженное</tspan> · <tspan fill="#9aa0a6">нет данных</tspan></text>
</svg>`;

export default function AminoUreaSVG(props: PathwaySchemeProps) {
  return <PathwayCardSVG markup={SVG_MARKUP} {...props} />;
}
