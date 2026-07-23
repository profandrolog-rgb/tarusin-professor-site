import type { ComponentType } from "react";
import type { PathwaySchemeProps } from "./PathwayCardSVG";
import AminoNitrogenExchangeSVG from "./AminoNitrogenExchangeSVG";
import AminoUreaSVG from "./AminoUreaSVG";
import AromaticAaMetabolismSVG from "./AromaticAaMetabolismSVG";
import BcaaCatabolismSVG from "./BcaaCatabolismSVG";
import BetaAlanineMetabolismSVG from "./BetaAlanineMetabolismSVG";
import CarbohydratePyruvateSVG from "./CarbohydratePyruvateSVG";
import CollagenTurnoverSVG from "./CollagenTurnoverSVG";
import EnergyTcaSVG from "./EnergyTcaSVG";
import FattyAcidOxidationSVG from "./FattyAcidOxidationSVG";
import GlutathioneDetoxSVG from "./GlutathioneDetoxSVG";
import GlycerophospholipidAminesSVG from "./GlycerophospholipidAminesSVG";
import GlycineSerineThreonineSVG from "./GlycineSerineThreonineSVG";
import HistidineMuscleTurnoverSVG from "./HistidineMuscleTurnoverSVG";
import KetogenesisBetaOxidationSVG from "./KetogenesisBetaOxidationSVG";
import LysineCatabolismSVG from "./LysineCatabolismSVG";
import MethylationSVG from "./MethylationSVG";
import Omega3PufaSVG from "./Omega3PufaSVG";
import Omega6PufaSVG from "./Omega6PufaSVG";
import Omega9MufaSVG from "./Omega9MufaSVG";
import OxalateGlyoxylateSVG from "./OxalateGlyoxylateSVG";
import SulfurOneCarbonSVG from "./SulfurOneCarbonSVG";
import TryptophanKynurenineSVG from "./TryptophanKynurenineSVG";

export const PATHWAY_CARD_SCHEMES: Record<
  string,
  ComponentType<PathwaySchemeProps>
> = {
  amino_nitrogen_exchange: AminoNitrogenExchangeSVG,
  amino_urea: AminoUreaSVG,
  aromatic_aa_metabolism: AromaticAaMetabolismSVG,
  bcaa_catabolism: BcaaCatabolismSVG,
  beta_alanine_metabolism: BetaAlanineMetabolismSVG,
  carbohydrate_pyruvate: CarbohydratePyruvateSVG,
  collagen_turnover: CollagenTurnoverSVG,
  energy_tca: EnergyTcaSVG,
  fatty_acid_oxidation: FattyAcidOxidationSVG,
  glutathione_detox: GlutathioneDetoxSVG,
  glycerophospholipid_amines: GlycerophospholipidAminesSVG,
  glycine_serine_threonine: GlycineSerineThreonineSVG,
  histidine_muscle_turnover: HistidineMuscleTurnoverSVG,
  ketogenesis_beta_oxidation: KetogenesisBetaOxidationSVG,
  lysine_catabolism: LysineCatabolismSVG,
  methylation: MethylationSVG,
  omega3_pufa: Omega3PufaSVG,
  omega6_pufa: Omega6PufaSVG,
  omega9_mufa: Omega9MufaSVG,
  oxalate_glyoxylate: OxalateGlyoxylateSVG,
  sulfur_one_carbon: SulfurOneCarbonSVG,
  tryptophan_kynurenine: TryptophanKynurenineSVG,
};
