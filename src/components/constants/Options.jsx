export const SelectBudgetOptions = [
    {
        id:1,
        icon: "💵",
        title:"Cheap",
        desc: "Economize and Save"
    },
    {
        id: 2,
        icon: "💰",
        title:"Moderate",
        desc: "Balance Cost and Comfort"
    },
    {
        id:3,
        icon: "💎",
        title:"Luxury",
        desc: "Induldge without Limits"
    },
]

export const SelectNoOfPersons = [
    {
        id:1,
        icon: "🚶",
        title: "Solo",
        desc: "Discovering on Your Own",
        no: "1 Person"
    },
    {
        id:2,
        icon: "💑",
        title: "Partner",
        desc: "Exploring with a Loved One",
        no: "2 People"
    },
    {
        id:3,
        icon: "👨‍👩‍👧‍👦",
        title: "Family",
        desc: "Fun for All Ages",
        no: "3 to 5 People"
    },
    {
        id:4,
        icon: "🤝",
        title: "Friends",
        desc: "Adventure with Your Crew",
        no: "5 to 10 People"
    },
]

// export const PROMPT = `Generate a travel itinerary for {location} for {noOfDays} days.
// Include hotels, places, and daily plans.

// Return ONLY valid JSON.
// Do not include explanations, markdown, or extra text.
// The response must start with { and end with }`

export const PROMPT = `Generate a travel itinerary for {location} for {noOfDays} days.
Include hotels, places, and daily plans.

Return ONLY valid JSON.
Do not include explanations, markdown, or extra text.

The JSON MUST follow this exact structure:

{
  "itinerary": [
    {
      "day": 1,
      "hotels": [
        {
          "name": "",
          "address": "",
          "rating": ""
        }
      ],
      "places": [
        {
          "name": "",
          "address": "",
          "description": ""
        }
      ]
    }
  ]
}

Rules:
- "itinerary" MUST be an array.
- Each day MUST be one object inside the array.
- "hotels" MUST be an array.
- "places" MUST be an array.
- Do NOT use keys like "Day 1", "Day 2".
- The response must start with { and end with }.
`;
