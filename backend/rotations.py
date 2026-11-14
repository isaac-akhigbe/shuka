"""Rotation strategies common or recommended in northern Nigeria.

Each rotation is a 2-year cycle. A season can hold one crop or an intercrop
(two crops in the same field, which is common practice in the north).
"""

ROTATIONS = {
    "maize-maize": {
        "name": "Maize every year",
        "seasons": [["maize"], ["maize"]],
        "description": "The same cereal on the same land every season.",
    },
    "sorghum-sorghum": {
        "name": "Guinea corn every year",
        "seasons": [["sorghum"], ["sorghum"]],
        "description": "Guinea corn year after year, common on poorer soils.",
    },
    "millet-millet": {
        "name": "Millet every year",
        "seasons": [["millet"], ["millet"]],
        "description": "Millet year after year, common in the far north.",
    },
    "milletcowpea-milletcowpea": {
        "name": "Millet with beans every year",
        "seasons": [["millet", "cowpea"], ["millet", "cowpea"]],
        "description": "The classic far-north mix, the same pairing on the same land every season.",
    },
    "sorghumcowpea-sorghumcowpea": {
        "name": "Guinea corn with beans every year",
        "seasons": [["sorghum", "cowpea"], ["sorghum", "cowpea"]],
        "description": "A common northern intercrop, the same pairing on the same land every season.",
    },
    "maize-soybean": {
        "name": "Maize, then soya beans",
        "seasons": [["maize"], ["soybean"]],
        "description": "Alternate a cereal with a nitrogen-fixing legume.",
    },
    "maize-groundnut": {
        "name": "Maize, then groundnut",
        "seasons": [["maize"], ["groundnut"]],
        "description": "Alternate maize with groundnut, a legume cash crop.",
    },
    "sorghumcowpea-groundnut": {
        "name": "Guinea corn with beans, then groundnut",
        "seasons": [["sorghum", "cowpea"], ["groundnut"]],
        "description": "Intercrop guinea corn and beans, then rotate to groundnut.",
    },
    "milletcowpea-sorghum": {
        "name": "Millet with beans, then guinea corn",
        "seasons": [["millet", "cowpea"], ["sorghum"]],
        "description": "Short-season, drought-hardy mix for dry, risky areas.",
    },
    "sesame-sorghumcowpea": {
        "name": "Beniseed, then guinea corn with beans",
        "seasons": [["sesame"], ["sorghum", "cowpea"]],
        "description": "Adds an export cash crop and breaks cereal pest cycles.",
    },
}

# Rotations a farmer can pick as "what I do now"
# Ordered from most to least common in the far north
CURRENT_OPTIONS = ["sorghumcowpea-sorghumcowpea", "milletcowpea-milletcowpea", "sorghum-sorghum",
                   "millet-millet", "maize-maize", "maize-groundnut", "maize-soybean"]
