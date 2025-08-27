import { Game, type GameFolders } from "../types/games";

const mtgFolders: GameFolders[] = [
  {
    id: "1EAqEy5Hpb-DTOj1nUdwxHpnrBx7MexXH",
    name: "Esper - Y'shtola Spellslinger",
    bleed: false,
    game: Game.MTG
  },
  {
    id: "1ZC81zbzZHThYNDMlPR0GO6csTnKKsGLd",
    name: "Proxy Adventure Time",
    bleed: true,
    game: Game.MTG
  },
]

const optcgFolders: GameFolders[] = [
  // Main Sets
  {
    id: "1TcsliNESunCVt-AOShceR64nX4sYXaoF",
    name: "OP11",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "1K3lkcWQJfwEFxv4TsO3KJ8ZZnSR0TGTz",
    name: "OP11 Alts",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "1N8deCs55bSYTyQPBHIrz9gpNhK9nmv0V",
    name: "OP11 SPs",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "1b5fBoKcl_j_951dw8v4DEDBC1V2ekB0X",
    name: "OP12",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "1v5Aaxl5LPsqzOrwF43bKesfQrWEtoJbY",
    name: "OP12 Alts",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "1QoTBoZyHEsFQMkP-I2xMSAJGFXmhSnk6",
    name: "OP12 SPs",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "11OCtst5VqNhXuGzpRez-HnGwilTXMCSS",
    name: "OP13",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "1f8PRrd8kK5dy3GfO_Abn8bdYLdpAY9Xf",
    name: "OP13 Alts",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "1i6taSwaHku8VMRd1pRGiyXKSroHuk25Z",
    name: "OP13 SPs",
    bleed: false,
    game: Game.OPTCG
  },

  // Sub Sets
  {
    id: "11fOuBoV1YmjA-sjAqWW41LciBZvg34ip",
    name: "EB02",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "1xODPK2EDZarV8RznosozDWibIo_oITHM",
    name: "EB02 Alts",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "1yuUu3NZokAFo83aAkeQD0lGo2Exf7ye8",
    name: "PRB02",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "1qQW_vopy2dzMMzkYufek6IBauNkHYYQ3",
    name: "PRB02 Alts",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "143iz5yQXYvVkipQFTEn7qsFB6T4GDacO",
    name: "PRB02 SPs",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "17_IIzxZlKsJlCW_dtKPwcib1fpmmvZSC",
    name: "PRB02 Don!!",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "1WNfIRCag7dlZ41ZVjHpnK-8o6pe_wWhD",
    name: "PRB02 Gold Don!!",
    bleed: false,
    game: Game.OPTCG
  },

  // Starter decks
  {
    id: "1dYrWB8PEqbrsbw6hDxVEj6eJP31wN7Za",
    name: "ST21",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "10puThJtSgrb4qrA1M6GVBwAah3TIeqZG",
    name: "ST21 Alts",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "1w4MsPOecBbp-Boe_InTWHuU8KaH5nyIt",
    name: "ST22",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "16RKWnGgWZQNLBkq4r5pAvw-7KS_WciBe",
    name: "ST22 Alts",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "1UHI49i1xH5MJIwUfvZI0H2SLyVmG-ZkO",
    name: "ST23",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "1cFz1g0-7Tdv6WF0xwNQype9JFMz1_0Ng",
    name: "ST24",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "10XDlpRNuZz5_qxhLGVAeLaV5U_2fAwCd",
    name: "ST25",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "1k8rrB8KqT6XcF7MHWyXvwy3xwtcVLNeV",
    name: "ST26",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "1zGWKGMaWDfXenOuvACOv0Kpy-Zchw98g",
    name: "ST27",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "1Y3U20ykH9FzmcbSGmkCZ_eluq_Daa1gZ",
    name: "ST28",
    bleed: false,
    game: Game.OPTCG
  },

  // Promos
  {
    id: "1dYrWB8PEqbrsbw6hDxVEj6eJP31wN7Za",
    name: "Promos",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "10puThJtSgrb4qrA1M6GVBwAah3TIeqZG",
    name: "Promos Alts",
    bleed: false,
    game: Game.OPTCG
  },

  // Don!! folders
  {
    id: "1yyuR8acsS7jVJOHNjuB6JsL8kfj6-8Hd",
    name: "Don!!",
    bleed: false,
    game: Game.OPTCG
  },

  // Tournament cards
  {
    id: "1fWFeRHVn4-M6JHGvpHUxjF8-wPm22voF",
    name: "Black Specials AA",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "1Qg_uaVS0MsRkuYHNg_lqVJDpasDJ59_w",
    name: "Blue Specials AA",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "13D7uLSvxkwyUb7AkL7dGfqhb-mCZkcCC",
    name: "Green Specials AA",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "1OHeNKFakvGBhFik11maa-yWawYX7GOO9",
    name: "Purple Specials AA",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "1lmMGEHgeO3b6vhXljsWgbXRrcHyUgdOt",
    name: "Red Specials AA",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "1UOYCXnVfHsIJb_6gxHW5qVHANnWHlhTV",
    name: "Yellow Specials AA",
    bleed: false,
    game: Game.OPTCG
  },
  {
    id: "1eMIxcDvJ21S1Oj3dNqFnRHlJc0vhHJuF",
    name: "Leaders Specials AA",
    bleed: false,
    game: Game.OPTCG
  },

  // Custom folders
  {
    id: "1eOmfpNGRE7jTnf5q9YetxvMiI7MTzr5r",
    name: "Custom Cards",
    bleed: false,
    game: Game.OPTCG
  }
]

const riftboundFolders: GameFolders[] = [
  {
    id: "1gkCbbN20nH4ySnt-BfgFus8QcuYzu0SP",
    name: "Riftbound Origin",
    bleed: false,
    game: Game.RIFTBOUND
  }
]

export const gameFolders: GameFolders[] = [
  ...mtgFolders,
  ...optcgFolders,
  ...riftboundFolders,
];
