# Excel Export Fix - Backward Compatibility for Question Subsections

## Problem
The Excel export was showing "-" for detailed question subsections (1.1, 1.2, 1.3, etc.) for most students, even though the feedback showed all the details correctly.

## Root Cause
- Newer evaluations store data in `questionScores` format with subsection details
- Older evaluations only have `criteriaGrades` format which doesn't preserve subsection structure well
- The Excel export code only looked for `questionScores`, so older evaluations appeared as empty columns

## Solution
Created a backward compatibility transformation function `transformCriteriaGradesToQuestionScores()` that:
1. Takes old `criteriaGrades` format
2. Groups subsections by base question number
3. Recreates the `questionScores` structure with subsections
4. Handles multiple formats: "1.1", "1a", "1(a)", etc.

## Changes Made
1. **Added transformation function** (`transformCriteriaGradesToQuestionScores`)
   - Converts old criteriaGrades to new questionScores format
   - Preserves all scores and feedback
   - Groups subsections properly

2. **Updated `defineQuestionColumns()`**
   - Now checks for questionScores first
   - If not found, transforms criteriaGrades
   - Creates proper column headers for all students

3. **Updated `populateDataRows()`**
   - Uses transformation for backward compatibility
   - Ensures all students get detailed subsection scores

4. **Updated feedback generation**
   - Also uses transformed data for consistency

## Result
Excel export now shows detailed subsection scores for ALL students, regardless of when they were evaluated.

## Testing
Run the test: `node test-transformation.js`
Shows the transformation correctly handles:
- Numeric subsections (1.1, 1.2, 1.3)
- Letter subsections (3a, 3b)
- Standalone questions (no subsections)
