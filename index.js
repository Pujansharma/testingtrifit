const express = require("express");
const app = express();
const port = 3000;
const cors =require("cors");
app.use(cors());
// Middleware
app.use(express.json());

// Activity level multipliers
const activityLevels = {
  "1": { label: "Sedentary", multiplier: 1.2 },
  "2": { label: "Lightly active", multiplier: 1.375 },
  "3": { label: "Moderately active", multiplier: 1.55 },
  "4": { label: "Very active", multiplier: 1.725 },
  "5": { label: "Super active", multiplier: 1.9 },
};

// BMR calculation using US units
function calculateBMR(gender, weightLbs, heightInches, age) {
  if (gender === "male") {
    return 66 + (6.23 * weightLbs) + (12.7 * heightInches) - (6.8 * age);
  } else {
    return 655 + (4.35 * weightLbs) + (4.7 * heightInches) - (4.7 * age);
  }
}

function calculateTDEE(bmr, multiplier) {
  return bmr * multiplier;
}

function calorieRecommendations(tdee) {
  return {
    maintain: Math.round(tdee),
    mildLoss: Math.round(tdee - 250),
    weightLoss: Math.round(tdee - 500),
    mildGain: Math.round(tdee + 250),
    weightGain: Math.round(tdee + 500),
  };
}

// POST route to calculate TDEE
app.post("/api/tdee", (req, res) => {
  const { age, gender, height, weight, activityLevel } = req.body;

  // Basic validation
  if (!age || !gender || !height || !weight || !activityLevel) {
    return res.status(400).json({ error: "Please provide all required fields." });
  }

  const activity = activityLevels[activityLevel];
  if (!activity) {
    return res.status(400).json({ error: "Invalid activity level. Choose between 1-5." });
  }

  const bmr = calculateBMR(gender.toLowerCase(), weight, height, age);
  const tdee = calculateTDEE(bmr, activity.multiplier);
  const recommendations = calorieRecommendations(tdee);

  res.json({
    bmr: Math.round(bmr),
    tdee: recommendations.maintain,
    caloriesToLoseWeight: {
      mild: recommendations.mildLoss,
      aggressive: recommendations.weightLoss,
    },
    caloriesToGainWeight: {
      mild: recommendations.mildGain,
      aggressive: recommendations.weightGain,
    },
    activityLevel: activity.label,
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
