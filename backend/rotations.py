ROTATIONS = {
    "maize-maize": {
        "name": "Maize every year",
        "seasons": [["maize"], ["maize"]],
        "description": "The same cereal on the same land every season.",
    },
    "sorghum-sorghum": {
        "name": "Sorghum every year",
        "seasons": [["sorghum"], ["sorghum"]],
        "description": "Sorghum year after year, common on poorer soils.",
    },
    "millet-millet": {
        "name": "Millet every year",
        "seasons": [["millet"], ["millet"]],
        "description": "Millet year after year, common in the far north.",
    },
    "maize-soybean": {
        "name": "Maize, then soybean",
        "seasons": [["maize"], ["soybean"]],
        "description": "Alternate a cereal with a nitrogen-fixing legume.",
    },
    "maize-groundnut": {
        "name": "Maize, then groundnut",
        "seasons": [["maize"], ["groundnut"]],
        "description": "Alternate maize with groundnut, a legume cash crop.",
    },
    "sorghumcowpea-groundnut": {
        "name": "Sorghum with cowpea, then groundnut",
        "seasons": [["sorghum", "cowpea"], ["groundnut"]],
        "description": "Intercrop sorghum and cowpea, then rotate to groundnut.",
    },
    "milletcowpea-sorghum": {
        "name": "Millet with cowpea, then sorghum",
        "seasons": [["millet", "cowpea"], ["sorghum"]],
        "description": "Short-season, drought-hardy mix for dry, risky areas.",
    },
    "sesame-sorghumcowpea": {
        "name": "Sesame, then sorghum with cowpea",
        "seasons": [["sesame"], ["sorghum", "cowpea"]],
        "description": "Adds an export cash crop and breaks cereal pest cycles.",
    },
}

# Rotations a farmer can pick as "what I do now"
CURRENT_OPTIONS = ["maize-maize", "sorghum-sorghum", "millet-millet", "maize-soybean",
                   "maize-groundnut"]
