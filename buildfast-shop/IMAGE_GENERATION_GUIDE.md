# 📸 IMAGE GENERATION SYSTEM - COMPLETE GUIDE

## ✅ PROBLEM SOLVED: Real Pexels Photos

We now use **REAL photo IDs from Pexels API** instead of fake ones.

---

## 🎯 TWO SCRIPTS AVAILABLE

### Script 1: `fetch_real_pexels_photos.js`
**Purpose**: Fetch NEW photos from Pexels API

**When to use**:
- First time setup
- Want completely NEW/DIFFERENT photos
- Want to refresh with latest Pexels content

**What it does**:
1. Calls Pexels API with your API key
2. Searches for: pizza, burger, pasta, chicken, beef, fish, etc.
3. Gets 231+ real, verified photo IDs
4. Saves to `pexels_photo_ids.json`
5. Generates `REAL_PEXELS_API_PHOTOS.sql`

**Run it**:
```bash
node fetch_real_pexels_photos.js
```

---

### Script 2: `generate_images_from_saved_ids.js`
**Purpose**: Regenerate SQL from SAVED photo IDs

**When to use**:
- Want to keep the SAME photos
- Just need to regenerate SQL
- Don't want to call Pexels API again

**What it does**:
1. Reads `pexels_photo_ids.json` (saved IDs)
2. Uses the SAME 231 photo IDs
3. Generates `REGENERATED_PEXELS_PHOTOS.sql`
4. Consistent results every time

**Run it**:
```bash
node generate_images_from_saved_ids.js
```

---

## 📋 STEP-BY-STEP WORKFLOW

### OPTION A: Using Existing Saved Photos (RECOMMENDED)
```bash
# 1. Use saved photo IDs to generate SQL
node generate_images_from_saved_ids.js

# 2. Open REGENERATED_PEXELS_PHOTOS.sql
# 3. Copy SQL and run in Supabase
# 4. Hard refresh browser (Ctrl+Shift+R)
```

### OPTION B: Fetch Fresh Photos from Pexels
```bash
# 1. Fetch new photos from Pexels API
node fetch_real_pexels_photos.js

# 2. Open REAL_PEXELS_API_PHOTOS.sql
# 3. Copy SQL and run in Supabase
# 4. Hard refresh browser (Ctrl+Shift+R)
```

---

## 🔑 FILES EXPLAINED

| File | Purpose |
|------|---------|
| `pexels_photo_ids.json` | Saved list of 231 real Pexels photo IDs |
| `fetch_real_pexels_photos.js` | Script to fetch NEW photos from API |
| `generate_images_from_saved_ids.js` | Script to use SAVED photos |
| `REAL_PEXELS_API_PHOTOS.sql` | SQL from fresh API fetch |
| `REGENERATED_PEXELS_PHOTOS.sql` | SQL from saved IDs |

---

## ✅ GUARANTEES

### What's GUARANTEED:
- ✓ All 231 photo IDs are REAL (fetched from Pexels)
- ✓ Photos match dish categories (pizza→pizza, etc.)
- ✓ NO fake IDs that cause duplicates
- ✓ NO fallback images
- ✓ Every URL is unique (cache busting)

### Photo Distribution:
- 🍕 Pizza: 25 photos
- 🍔 Burgers: 30 photos
- 🍝 Pasta: 15 photos
- 🍜 Noodles: 15 photos
- 🍗 Chicken: 70 photos (fried, grilled, curry)
- 🥩 Beef: 25 photos
- 🐟 Fish/Seafood: 35 photos
- 🍚 Rice/Biryani: 15 photos
- And more!

---

## 🔄 API USAGE

### Pexels API Key:
```
6wVsvYgS5DrwWUCUsE7yAplSP3vZLzhpAPshm7vvUZ6G4uoDMl5jyyOH
```

### Rate Limits:
- 200 requests per hour
- 20,000 requests per month

### Current Usage:
- Each run of `fetch_real_pexels_photos.js` = ~20 API requests
- You can run it ~10 times per hour

---

## 💡 RECOMMENDATIONS

1. **Use Script 2 for consistency**
   - Run `generate_images_from_saved_ids.js`
   - Always uses same verified photos
   - No API calls needed

2. **Use Script 1 for variety**
   - Run `fetch_real_pexels_photos.js`
   - Gets fresh, different photos
   - Uses API quota

3. **Keep pexels_photo_ids.json**
   - This is your "photo database"
   - Backup this file
   - Share with team for consistency

---

## 🎯 SUMMARY

**YES**, the system now uses **100% REAL Pexels photos** from the API.

**You can regenerate anytime** using saved IDs without calling the API again.

**No more duplicates** - all photo IDs are verified to exist on Pexels!
