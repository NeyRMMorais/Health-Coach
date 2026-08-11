import { Exercise } from '../types';

export const DEFAULT_EXERCISES: Exercise[] = [
  // Chest
  { id: 'bench-press-barbell', name: 'Barbell Bench Press', targetMuscleGroup: 'Chest', category: 'Barbell', description: 'Flat bench press with barbell for overall chest strength.' },
  { id: 'incline-dumbbell-press', name: 'Incline Dumbbell Press', targetMuscleGroup: 'Chest', category: 'Dumbbell', description: 'Upper chest focus using adjustable incline bench.' },
  { id: 'chest-fly-cable', name: 'Cable Chest Fly', targetMuscleGroup: 'Chest', category: 'Cable', description: 'Constant tension chest isolation flyes.' },
  { id: 'push-up', name: 'Push-Up', targetMuscleGroup: 'Chest', category: 'Bodyweight', description: 'Bodyweight chest and core builder.' },
  { id: 'dips-chest', name: 'Chest Dips', targetMuscleGroup: 'Chest', category: 'Bodyweight', description: 'Bodyweight dips leaning forward for lower chest.' },

  // Back
  { id: 'deadlift-barbell', name: 'Barbell Deadlift', targetMuscleGroup: 'Back', category: 'Barbell', description: 'Posterior chain compound lift.' },
  { id: 'pull-up', name: 'Pull-Up', targetMuscleGroup: 'Back', category: 'Bodyweight', description: 'Overhand grip lat builder.' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', targetMuscleGroup: 'Back', category: 'Cable', description: 'Upper back and lat width development.' },
  { id: 'bent-over-row-barbell', name: 'Barbell Bent Over Row', targetMuscleGroup: 'Back', category: 'Barbell', description: 'Mid-back thickness compound movement.' },
  { id: 'single-arm-dumbbell-row', name: 'Single Arm Dumbbell Row', targetMuscleGroup: 'Back', category: 'Dumbbell', description: 'Unilateral lat and upper back row.' },
  { id: 'seated-cable-row', name: 'Seated Cable Row', targetMuscleGroup: 'Back', category: 'Cable', description: 'Horizontal cable rowing for back thickness.' },

  // Legs
  { id: 'barbell-squat', name: 'Barbell Back Squat', targetMuscleGroup: 'Legs', category: 'Barbell', description: 'King of leg compound exercises.' },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift (RDL)', targetMuscleGroup: 'Legs', category: 'Barbell', description: 'Hamstring and glute stretch & strength.' },
  { id: 'leg-press', name: 'Leg Press', targetMuscleGroup: 'Legs', category: 'Machine', description: 'Quad-heavy machine press.' },
  { id: 'walking-lunges', name: 'Dumbbell Walking Lunges', targetMuscleGroup: 'Legs', category: 'Dumbbell', description: 'Unilateral quad and glute strength.' },
  { id: 'leg-extension', name: 'Leg Extension', targetMuscleGroup: 'Legs', category: 'Machine', description: 'Quad isolation exercise.' },
  { id: 'lying-leg-curl', name: 'Lying Leg Curl', targetMuscleGroup: 'Legs', category: 'Machine', description: 'Hamstring isolation curl.' },
  { id: 'standing-calf-raise', name: 'Standing Calf Raise', targetMuscleGroup: 'Legs', category: 'Machine', description: 'Gastrocnemius calf builder.' },

  // Shoulders
  { id: 'overhead-press-barbell', name: 'Overhead Barbell Press (OHP)', targetMuscleGroup: 'Shoulders', category: 'Barbell', description: 'Strict overhead shoulder press.' },
  { id: 'seated-dumbbell-shoulder-press', name: 'Seated Dumbbell Shoulder Press', targetMuscleGroup: 'Shoulders', category: 'Dumbbell', description: 'Deltoid builder with neutral or pronated grip.' },
  { id: 'dumbbell-lateral-raise', name: 'Dumbbell Lateral Raise', targetMuscleGroup: 'Shoulders', category: 'Dumbbell', description: 'Side deltoid isolation.' },
  { id: 'face-pull', name: 'Cable Face Pull', targetMuscleGroup: 'Shoulders', category: 'Cable', description: 'Rear delt and rotator cuff health.' },
  { id: 'reverse-cable-fly', name: 'Reverse Cable Fly', targetMuscleGroup: 'Shoulders', category: 'Cable', description: 'Posterior deltoid isolation.' },

  // Arms
  { id: 'barbell-bicep-curl', name: 'Barbell Bicep Curl', targetMuscleGroup: 'Arms', category: 'Barbell', description: 'Classic bicep mass builder.' },
  { id: 'dumbbell-hammer-curl', name: 'Dumbbell Hammer Curl', targetMuscleGroup: 'Arms', category: 'Dumbbell', description: 'Brachialis and forearm builder.' },
  { id: 'tricep-rope-pushdown', name: 'Tricep Rope Pushdown', targetMuscleGroup: 'Arms', category: 'Cable', description: 'Lateral head tricep extension.' },
  { id: 'skullcrushers', name: 'EZ-Bar Skullcrushers', targetMuscleGroup: 'Arms', category: 'Barbell', description: 'Long head tricep extension.' },

  // Core
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', targetMuscleGroup: 'Core', category: 'Bodyweight', description: 'Lower abdominal and hip flexor strength.' },
  { id: 'plank', name: 'Plank', targetMuscleGroup: 'Core', category: 'Bodyweight', description: 'Isometric core stability hold.' },
  { id: 'cable-ab-crunch', name: 'Kneeling Cable Ab Crunch', targetMuscleGroup: 'Core', category: 'Cable', description: 'Weighted abdominal crunch.' },

  // Stretching & Flexibility
  { id: 'standing-hamstring-stretch', name: 'Standing Hamstring Stretch', targetMuscleGroup: 'Legs', category: 'Stretching', description: 'Improves hamstring flexibility and relieves lower back tightness.' },
  { id: 'standing-quad-stretch', name: 'Standing Quadriceps Stretch', targetMuscleGroup: 'Legs', category: 'Stretching', description: 'Stretches quads and hip flexors for mobility and posture.' },
  { id: 'kneeling-hip-flexor-stretch', name: 'Kneeling Hip Flexor Stretch', targetMuscleGroup: 'Legs', category: 'Stretching', description: 'Opens tight hip flexors from prolonged sitting.' },
  { id: 'pigeon-pose-stretch', name: 'Pigeon Pose Glute Stretch', targetMuscleGroup: 'Legs', category: 'Stretching', description: 'Deep glute and piriformis stretch for hip mobility.' },
  { id: 'calf-wall-stretch', name: 'Standing Wall Calf Stretch', targetMuscleGroup: 'Legs', category: 'Stretching', description: 'Stretches gastrocnemius and soleus muscles in calves.' },
  { id: 'seated-butterfly-stretch', name: 'Seated Butterfly Adductor Stretch', targetMuscleGroup: 'Legs', category: 'Stretching', description: 'Opens inner thighs, adductors, and groin muscles.' },
  { id: 'cat-cow-stretch', name: 'Cat-Cow Spine Mobilization', targetMuscleGroup: 'Back', category: 'Stretching', description: 'Dynamic spinal flexion and extension for back mobility.' },
  { id: 'child-pose-lat-stretch', name: "Child's Pose Lat Stretch", targetMuscleGroup: 'Back', category: 'Stretching', description: 'Relaxing stretch for lats, upper back, and shoulders.' },
  { id: 'cobra-abdominal-stretch', name: 'Cobra / Upward Dog Stretch', targetMuscleGroup: 'Core', category: 'Stretching', description: 'Extends spine and stretches rectus abdominis.' },
  { id: 'doorway-pec-stretch', name: 'Doorway Chest & Pec Stretch', targetMuscleGroup: 'Chest', category: 'Stretching', description: 'Opens tight pectoralis major and minor muscles.' },
  { id: 'cross-body-shoulder-stretch', name: 'Cross-Body Shoulder Stretch', targetMuscleGroup: 'Shoulders', category: 'Stretching', description: 'Stretches posterior deltoid and upper back muscles.' },
  { id: 'overhead-tricep-stretch', name: 'Overhead Tricep & Lat Stretch', targetMuscleGroup: 'Arms', category: 'Stretching', description: 'Stretches triceps and lats above head.' },
  { id: 'world-greatest-stretch', name: "World's Greatest Stretch", targetMuscleGroup: 'Full Body', category: 'Stretching', description: 'Full-body dynamic warmup and mobility stretch.' },
  { id: 'downward-facing-dog', name: 'Downward-Facing Dog', targetMuscleGroup: 'Full Body', category: 'Stretching', description: 'Comprehensive stretch for calves, hamstrings, back, and shoulders.' },
];
