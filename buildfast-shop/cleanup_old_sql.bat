@echo off
echo ════════════════════════════════════════════════════════
echo CLEANING UP OLD SQL FILES
echo ════════════════════════════════════════════════════════
echo.
echo Keeping ONLY: FINAL_FIX_NO_DUPLICATES.sql
echo.

REM Delete image-related SQL files (keeping the final one)
del /Q "CATEGORY_MATCHED_IMAGES.sql" 2>nul
del /Q "COMPREHENSIVE_203_UNIQUE.sql" 2>nul
del /Q "COPY_THIS_TO_SUPABASE.sql" 2>nul
del /Q "FIX_DUPLICATES_FINAL.sql" 2>nul
del /Q "REAL_PEXELS_API_PHOTOS.sql" 2>nul
del /Q "REGENERATED_PEXELS_PHOTOS.sql" 2>nul
del /Q "RUN_THIS_NOW.sql" 2>nul
del /Q "VERIFIED_PEXELS_IDS.sql" 2>nul
del /Q "APPLY_THIS_IN_SUPABASE.sql" 2>nul
del /Q "CHECK_ACTUAL_URLS.sql" 2>nul
del /Q "CLEAR_ALL_IMAGES.sql" 2>nul
del /Q "CLEAR_AND_READY.sql" 2>nul
del /Q "COMPLETE_IMAGE_FIX_VERIFIED.sql" 2>nul
del /Q "COPY_THIS_SQL_NOW.sql" 2>nul
del /Q "DEBUG_BLACK_IMAGES.sql" 2>nul
del /Q "FIX_IMAGE_DISPLAY.sql" 2>nul
del /Q "FIX_NOW.sql" 2>nul
del /Q "FORCE_CLEAR_ALL_IMAGES.sql" 2>nul
del /Q "MASTER_FIX.sql" 2>nul
del /Q "REGENERATE_WITH_BETTER_URLS.sql" 2>nul
del /Q "RUN_THIS_SQL_NOW.sql" 2>nul

echo ✅ Deleted old image-related SQL files
echo.
echo ════════════════════════════════════════════════════════
echo IMPORTANT SQL FILES TO KEEP:
echo ════════════════════════════════════════════════════════
echo.
echo ✅ FINAL_FIX_NO_DUPLICATES.sql - USE THIS FOR IMAGES!
echo.
echo Other important SQL files (not deleted):
dir /B *.sql | findstr /V "FINAL_FIX_NO_DUPLICATES"
echo.
echo ════════════════════════════════════════════════════════
echo CLEANUP COMPLETE!
echo ════════════════════════════════════════════════════════
pause
