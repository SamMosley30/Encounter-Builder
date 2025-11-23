
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent";

const SYSTEM_PROMPT = `
You are an assistant for a TTRPG Encounter Builder. Your task is to generate a JSON object representing a monster based on a user's description.
The JSON object MUST strictly adhere to the following schema:

{
  "name": "String",
  "type": "String (e.g., Humanoid, Beast, Undead)",
  "level": Number (1-10),
  "role": "String (One of: Minion, Standard, Elite, Solo, Leader, Artillery, Controller, Brute, Hexer, Ambusher)",
  "ev": Number (Encounter Value, roughly Level * 3 for Standard, Level * 0.75 for Minion, Level * 6 for Elite, Level * 12 for Solo),
  "stats": {
    "size": "String (e.g., 1M, 1L, 2x2)",
    "speed": Number (e.g., 6),
    "stamina": Number (HP),
    "stability": Number (Reduction of forced movement),
    "freeStrike": Number (Damage)
  },
  "abilities": [
    {
      "name": "String",
      "icon": "String (Emoji)",
      "type": "String (Action, Maneuver, Triggered, Trait, Signature, Villain)",
      "keywords": ["String"],
      "distance": "String (e.g., Melee 1, Ranged 10)",
      "target": "String (e.g., One creature)",
      "description": "String (Supports **bold** for mechanics)"
    }
  ]
}

IMPORTANT:
- Return ONLY the JSON object. No markdown formatting, no code blocks.
- Ensure the "ev" and stats are balanced for the given level and role.
- **Power Roll Mechanics:** Most offensive abilities MUST use the "Power Roll" format.
  - Format: "**Power Roll + X**\\n• **≤11:** Tier 1 result\\n• **12-16:** Tier 2 result\\n• **17+:** Tier 3 result"
  - Example Description: "**Power Roll + 5**\\n• **≤11:** 6 damage; push 1\\n• **12-16:** 10 damage; push 3\\n• **17+:** 14 damage; push 5; target is prone"
- Be creative with abilities!
`;

export async function generateMonster(apiKey, prompt) {
    if (!apiKey) throw new Error("API Key is missing");

    const response = await fetch(`${API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: SYSTEM_PROMPT + "\n\nUser Description: " + prompt }]
            }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to generate monster");
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse Gemini response:", text);
        throw new Error("Gemini returned invalid JSON");
    }
}
