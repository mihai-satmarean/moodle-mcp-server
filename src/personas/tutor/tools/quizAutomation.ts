import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createQuizBlueprint } from './quizManagement.js';

export interface AutomatedQuizCreationArgs {
  moodleUrl: string;
  username: string;
  password: string;
  courseId: number;
  quizName: string;
  quizIntro: string;
  themes: Array<{
    title: string;
    description: string;
    keywords: string[];
  }>;
  questionsPerTheme?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  allowUnlimitedAttempts?: boolean;
  headless?: boolean;
}

export interface QuizCreationResult {
  success: boolean;
  quizUrl?: string;
  quizId?: string;
  error?: string;
  steps: string[];
}

/**
 * Create quiz automatically in Moodle using browser automation
 * This tool logs into Moodle, creates the quiz activity, imports questions, and publishes it
 */
export async function tutor_create_quiz_automated(args: AutomatedQuizCreationArgs): Promise<any> {
  const {
    moodleUrl,
    username,
    password,
    courseId,
    quizName,
    quizIntro,
    themes,
    questionsPerTheme = 1,
    difficulty = 'intermediate',
    allowUnlimitedAttempts = true,
    headless = true
  } = args;

  const steps: string[] = [];
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    steps.push('🎯 Starting automated quiz creation...');
    
    // Step 1: Generate quiz content
    steps.push('📝 Generating quiz questions...');
    const blueprint = await createQuizBlueprint(
      quizName,
      courseId,
      themes,
      questionsPerTheme,
      difficulty,
      allowUnlimitedAttempts
    );
    
    steps.push(`✅ Generated ${blueprint.questions.length} questions`);
    
    // Save XML to temporary file
    const tmpDir = os.tmpdir();
    const xmlPath = path.join(tmpDir, `moodle-quiz-${Date.now()}.xml`);
    fs.writeFileSync(xmlPath, blueprint.moodleXML, 'utf-8');
    steps.push(`💾 Saved XML to ${xmlPath}`);
    
    // Step 2: Launch browser
    steps.push('🌐 Launching browser...');
    browser = await chromium.launch({ headless });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });
    page = await context.newPage();
    
    // Step 3: Login to Moodle
    steps.push('🔐 Logging into Moodle...');
    const baseUrl = moodleUrl.replace(/\/webservice\/rest\/server\.php.*$/, '');
    await page.goto(`${baseUrl}/login/index.php`);
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    steps.push('✅ Logged in successfully');
    
    // Step 4: Navigate to course
    steps.push(`📚 Navigating to course ${courseId}...`);
    await page.goto(`${baseUrl}/course/view.php?id=${courseId}`);
    await page.waitForLoadState('networkidle');
    
    // Step 5: Turn editing on
    steps.push('✏️ Turning editing on...');
    try {
      const editButton = page.locator('input[name="setmode"][value="edit"]').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      steps.push('⚠️ Edit mode might already be on');
    }
    
    // Step 6: Add quiz activity
    steps.push('➕ Adding quiz activity...');
    
    // Find "Add an activity or resource" button
    const addActivityButton = page.locator('button:has-text("Add an activity or resource"), a:has-text("Add an activity or resource")').first();
    await addActivityButton.click();
    await page.waitForTimeout(1000);
    
    // Select Quiz from the activity chooser
    const quizOption = page.locator('a[data-internal="quiz"], div[data-internal="quiz"]').first();
    await quizOption.click();
    await page.waitForTimeout(1000);
    
    // If there's an "Add" button in modal, click it
    try {
      const addButton = page.locator('button:has-text("Add"), input[value="Add"]').first();
      if (await addButton.isVisible({ timeout: 2000 })) {
        await addButton.click();
      }
    } catch (e) {
      // Modal might auto-close
    }
    
    await page.waitForLoadState('networkidle');
    steps.push('✅ Quiz activity form opened');
    
    // Step 7: Fill quiz settings
    steps.push('⚙️ Configuring quiz settings...');
    
    // Quiz name
    await page.fill('input[name="name"]', quizName);
    
    // Quiz intro
    const introEditor = page.locator('div[id^="id_introeditor"] iframe').first();
    if (await introEditor.isVisible({ timeout: 2000 })) {
      const frame = await introEditor.contentFrame();
      if (frame) {
        await frame.locator('body').fill(quizIntro);
      }
    } else {
      await page.fill('textarea[name="introeditor[text]"]', quizIntro);
    }
    
    // Expand "Timing" section
    try {
      await page.click('a[href="#id_timinghdr"]');
      await page.waitForTimeout(500);
    } catch (e) {
      // Section might be expanded already
    }
    
    // Set unlimited attempts
    if (allowUnlimitedAttempts) {
      await page.selectOption('select[name="attempts"]', '0');
      steps.push('✅ Set unlimited attempts');
    }
    
    // Expand "Review options"
    try {
      await page.click('a[href="#id_reviewoptionshdr"]');
      await page.waitForTimeout(500);
    } catch (e) {
      // Section might be expanded
    }
    
    // Enable all review options
    const reviewCheckboxes = await page.locator('input[type="checkbox"][name^="review"]').all();
    for (const checkbox of reviewCheckboxes) {
      await checkbox.check();
    }
    steps.push('✅ Enabled review options');
    
    // Save and display
    await page.click('input[name="submitbutton"], button:has-text("Save and display")');
    await page.waitForLoadState('networkidle');
    steps.push('✅ Quiz created, opening edit mode...');
    
    // Step 8: Import questions
    steps.push('📥 Importing questions from XML...');
    
    // Click on "Edit quiz" or similar
    const editQuizButton = page.locator('button:has-text("Edit quiz"), a:has-text("Edit quiz")').first();
    if (await editQuizButton.isVisible({ timeout: 3000 })) {
      await editQuizButton.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Find and click on three-dot menu or "..." button
    const menuButton = page.locator('button[data-toggle="dropdown"], a.dropdown-toggle').first();
    await menuButton.click();
    await page.waitForTimeout(500);
    
    // Click "Import" from dropdown
    const importLink = page.locator('a:has-text("Import")').first();
    await importLink.click();
    await page.waitForLoadState('networkidle');
    steps.push('✅ Import page opened');
    
    // Select Moodle XML format
    await page.click('input[value="xml"]');
    await page.click('input[type="submit"][value="Next"], button:has-text("Next")');
    await page.waitForLoadState('networkidle');
    
    // Upload XML file
    const fileInput = page.locator('input[type="file"][name="newfile"]').first();
    await fileInput.setInputFiles(xmlPath);
    await page.waitForTimeout(1000);
    
    // Click "Import"
    await page.click('input[type="submit"][value="Import"], button:has-text("Import")');
    await page.waitForLoadState('networkidle');
    steps.push('✅ Questions imported successfully');
    
    // Click "Continue" if present
    try {
      const continueButton = page.locator('button:has-text("Continue"), input[value="Continue"]').first();
      if (await continueButton.isVisible({ timeout: 2000 })) {
        await continueButton.click();
        await page.waitForLoadState('networkidle');
      }
    } catch (e) {
      // Continue button might not be present
    }
    
    // Get quiz URL
    const currentUrl = page.url();
    const quizIdMatch = currentUrl.match(/[?&]id=(\d+)/);
    const quizId = quizIdMatch ? quizIdMatch[1] : 'unknown';
    
    steps.push(`✅ Quiz created successfully!`);
    steps.push(`🔗 Quiz URL: ${currentUrl}`);
    
    // Cleanup
    fs.unlinkSync(xmlPath);
    steps.push('🗑️ Cleaned up temporary XML file');
    
    await browser.close();
    
    return {
      content: [{
        type: 'text',
        text: `✅ Quiz Created Successfully!\n\n` +
          `📝 Quiz Name: ${quizName}\n` +
          `🆔 Quiz ID: ${quizId}\n` +
          `🔗 Quiz URL: ${currentUrl}\n` +
          `❓ Questions: ${blueprint.questions.length}\n` +
          `♾️ Attempts: ${allowUnlimitedAttempts ? 'Unlimited' : 'Limited'}\n\n` +
          `Steps completed:\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
      }],
      quizUrl: currentUrl,
      quizId: quizId,
      success: true,
      steps: steps
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    steps.push(`❌ ERROR: ${errorMessage}`);
    
    if (browser) {
      await browser.close();
    }
    
    return {
      content: [{
        type: 'text',
        text: `❌ Failed to create quiz automatically\n\n` +
          `Error: ${errorMessage}\n\n` +
          `Steps completed before error:\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n` +
          `💡 Tip: You can still use tutor_create_quiz_blueprint to generate XML and import manually.`
      }],
      success: false,
      error: errorMessage,
      steps: steps,
      isError: true
    };
  }
}

/**
 * Get Moodle credentials from environment or prompt
 */
export function getMoodleCredentials(): { username?: string; password?: string } {
  return {
    username: process.env.MOODLE_USERNAME,
    password: process.env.MOODLE_PASSWORD
  };
}
