/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT WEB APP - FIELD NOTES COMPREHENSIVE SPAM & BOT PROTECTION
 * ==============================================================================
 * 
 * STEP-BY-STEP DEPLOYMENT INSTRUCTIONS:
 * ------------------------------------------------------------------------------
 * 1. Create/Configure your Google Sheet:
 *    - Go to https://sheets.new and open your Google Sheet.
 *    - Ensure tab 1 (bottom left) is named "Submissions" (headers: Timestamp | Name | Email | Message).
 *    - Create a tab named "Rejected" (headers: Timestamp | Reason | Hashed/Truncated ID).
 * 
 * 2. Open Apps Script Editor:
 *    - In your Google Sheet, click "Extensions" > "Apps Script".
 *    - Delete any existing boilerplate code in Code.gs.
 *    - Copy and paste the ENTIRE contents of this file into the editor.
 *    - Click the Save icon (Ctrl+S or Cmd+S).
 * 
 * 3. Configure Cloudflare Turnstile Secret Key (Layer 5):
 *    - In the Apps Script Editor, click Project Settings (gear icon on the left menu).
 *    - Scroll down to "Script Properties" > click "Add script property".
 *    - Property name: TURNSTILE_SECRET
 *    - Value: YOUR_CLOUDFLARE_TURNSTILE_SECRET_KEY (from Cloudflare Dashboard)
 *    - Click "Save script properties".
 * 
 * 4. Deploy as a Web App:
 *    - Click "Deploy" button (top right) > "New deployment".
 *    - Select type: "Web app".
 *    - Description: "Field Notes Contact Form API v2 - AntiSpam Audit"
 *    - Execute as: "Me" (your Google account)
 *    - Who has access: "Anyone"
 *    - Click "Deploy", authorize access when prompted, and copy the Web App URL.
 * 
 * 5. Update Hugo Site Configuration:
 *    - In your `hugo.toml` file under [params], set:
 *      contactFormEndpoint = "YOUR_WEB_APP_URL"
 *      turnstileSiteKey = "YOUR_CLOUDFLARE_TURNSTILE_SITE_KEY"
 * ==============================================================================
 */

/**
 * Main HTTP POST handler. Evaluates submissions through a 7-layer defense system.
 */
function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var name = (data.name || "").toString().trim();
    var email = (data.email || "").toString().trim();
    var message = (data.message || "").toString().trim();
    var website = (data.website || "").toString().trim();
    var formTimeStr = (data.form_time || "").toString().trim();
    var turnstileToken = (data.turnstile_token || "").toString().trim();
    var type = (data.type || "").toString().trim();

    var clientIp = extractClientIp(e);

    // Auto-populate defaults if request is a newsletter subscription
    if (type === "newsletter" || (!name && !message)) {
      if (!name) name = "Newsletter Subscriber";
      if (!message) message = "Subscribed to Monthly Field Dispatch";
    }

    // ==========================================================================
    // LAYER 1: HONEYPOT FIELD CHECK
    // ==========================================================================
    // Real users cannot see or fill the 'website' field. If non-empty, it's a bot.
    // Silently return fake success without writing to Submissions to trap bots.
    if (website.length > 0) {
      logRejection("honeypot", email || clientIp);
      return createJsonResponse({ status: "success" });
    }

    // ==========================================================================
    // LAYER 2: TIME-BASED SUBMISSION CHECK
    // ==========================================================================
    // Humans take at least 2.5 seconds to fill and submit a form.
    // Cached/replayed form submissions over 1 hour old are also rejected.
    if (formTimeStr) {
      var renderTime = parseInt(formTimeStr, 10);
      var now = Date.now();
      if (!isNaN(renderTime)) {
        var elapsed = now - renderTime;
        if (elapsed < 2500) {
          logRejection("timing-too-fast", email || clientIp);
          return createJsonResponse({ status: "success" });
        }
        if (elapsed > 3600000) { // 1 hour
          logRejection("timing-expired", email || clientIp);
          return createJsonResponse({ status: "success" });
        }
      }
    }

    // ==========================================================================
    // LAYER 3: RATE LIMITING (EMAIL & IP)
    // ==========================================================================
    var cache = CacheService.getScriptCache();

    // 3a. Email Rate Limit: Max 1 submission per 60 seconds per email
    if (email) {
      var emailRateKey = "rate_limit_email_" + Utilities.base64EncodeWebSafe(email.toLowerCase());
      if (cache.get(emailRateKey) !== null) {
        logRejection("rate-limit-email", email);
        return createJsonResponse({
          status: "error",
          message: "Rate limit exceeded: Please wait 60 seconds before submitting another note."
        });
      }
      cache.put(emailRateKey, "1", 60);
    }

    // 3b. IP Rate Limit: Max 5 submissions per hour per IP
    if (clientIp) {
      var ipRateKey = "rate_limit_ip_" + Utilities.base64EncodeWebSafe(clientIp);
      var ipCount = parseInt(cache.get(ipRateKey) || "0", 10);
      if (ipCount >= 5) {
        logRejection("rate-limit-ip", clientIp);
        return createJsonResponse({
          status: "error",
          message: "Too many submissions from your connection. Please try again later."
        });
      }
      cache.put(ipRateKey, (ipCount + 1).toString(), 3600);
    }

    // ==========================================================================
    // LAYER 4: CONTENT HEURISTICS & DISPOSABLE EMAIL FILTER
    // ==========================================================================
    
    // 4a. Disposable Email Domain Check
    var disposableDomains = [
      'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com',
      'throwawaymail.com', 'yopmail.com', 'sharklasers.com', 'getnada.com',
      'dispostable.com', 'trashmail.com', 'maildrop.cc', 'fakeinbox.com'
    ];
    var emailParts = email.split('@');
    if (emailParts.length === 2) {
      var domain = emailParts[1].toLowerCase();
      if (disposableDomains.indexOf(domain) !== -1) {
        logRejection("disposable-email", email);
        return createJsonResponse({
          status: "error",
          message: "Disposable email addresses are not accepted."
        });
      }
    }

    // 4b. Multiple URLs in Message (Max 1 URL allowed)
    var urlMatches = message.match(/(https?:\/\/|www\.)/gi);
    if (urlMatches && urlMatches.length > 1) {
      logRejection("content-heuristic-urls", email || clientIp);
      return createJsonResponse({
        status: "error",
        message: "Message contains too many web links."
      });
    }

    // 4c. Name Field HTML or URL Check
    if (/(https?:\/\/|www\.|<|>)/gi.test(name)) {
      logRejection("content-heuristic-name-html", email || clientIp);
      return createJsonResponse({
        status: "error",
        message: "Invalid characters in name."
      });
    }

    // 4d. ALL CAPS / Gibberish Check
    if (message.length > 20) {
      var upperCaseCount = (message.match(/[A-Z]/g) || []).length;
      var letterCount = (message.match(/[a-zA-Z]/g) || []).length;
      if (letterCount > 10 && (upperCaseCount / letterCount) > 0.7) {
        logRejection("content-heuristic-all-caps", email || clientIp);
        return createJsonResponse({
          status: "error",
          message: "Please avoid using all uppercase letters in your message."
        });
      }
    }

    // Basic Input Validation
    if (!name || name.length > 100) {
      return createJsonResponse({ status: "error", message: "Name must be under 100 characters." });
    }

    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || email.length > 254) {
      return createJsonResponse({ status: "error", message: "Valid email address required." });
    }

    if (!message || message.length > 5000) {
      return createJsonResponse({ status: "error", message: "Message must be under 5000 characters." });
    }

    // ==========================================================================
    // LAYER 5: CLOUDFLARE TURNSTILE VERIFICATION
    // ==========================================================================
    var turnstileSecret = PropertiesService.getScriptProperties().getProperty('TURNSTILE_SECRET');
    if (turnstileSecret && turnstileSecret.trim().length > 0) {
      if (!turnstileToken) {
        logRejection("turnstile-missing-token", email || clientIp);
        return createJsonResponse({
          status: "error",
          message: "Turnstile security verification token missing. Please try again."
        });
      }

      var turnstileUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
      var verifyResponse = UrlFetchApp.fetch(turnstileUrl, {
        method: 'post',
        payload: {
          secret: turnstileSecret,
          response: turnstileToken,
          remoteip: clientIp
        },
        muteHttpExceptions: true
      });

      var verifyResult = {};
      try {
        verifyResult = JSON.parse(verifyResponse.getContentText());
      } catch (err) {}

      if (!verifyResult.success) {
        logRejection("turnstile-failed", email || clientIp);
        return createJsonResponse({
          status: "error",
          message: "Security verification failed. Please refresh and try again."
        });
      }
    }

    // ==========================================================================
    // LAYER 6: FORMULA INJECTION SANITIZATION
    // ==========================================================================
    var safeName = sanitizeForFormula(name);
    var safeEmail = sanitizeForFormula(email);
    var safeMessage = sanitizeForFormula(message);

    // ==========================================================================
    // RECORD VALID SUBMISSION TO "Submissions" SHEET
    // ==========================================================================
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName("Submissions");

    if (!sheet) {
      sheet = spreadsheet.insertSheet("Submissions");
      sheet.appendRow(["Timestamp", "Name", "Email", "Message"]);
    }

    sheet.appendRow([new Date(), safeName, safeEmail, safeMessage]);

    return createJsonResponse({ status: "success" });

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: "Server error processing submission: " + error.toString()
    });
  }
}

/**
 * Health check endpoint for testing deployment URL.
 */
function doGet(e) {
  return createJsonResponse({
    status: "active",
    message: "Field Notes Contact Form API (AntiSpam v2) is operational."
  });
}

/**
 * LAYER 7: LOGGING REJECTIONS TO SEPARATE "Rejected" SHEET TAB
 * Logs reason and hashed/truncated identifier without storing actual spam payloads.
 */
function logRejection(reason, rawIdentifier) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var rejectedSheet = spreadsheet.getSheetByName("Rejected");

    if (!rejectedSheet) {
      rejectedSheet = spreadsheet.insertSheet("Rejected");
      rejectedSheet.appendRow(["Timestamp", "Reason", "Truncated Identifier"]);
    }

    var safeId = "anonymous";
    if (rawIdentifier) {
      var str = rawIdentifier.toString().trim();
      if (str.indexOf("@") !== -1) {
        var parts = str.split("@");
        safeId = parts[0].substring(0, 3) + "***@" + parts[1];
      } else if (str.length > 6) {
        safeId = str.substring(0, 6) + "***";
      } else {
        safeId = str;
      }
    }

    rejectedSheet.appendRow([new Date(), sanitizeForFormula(reason), sanitizeForFormula(safeId)]);
  } catch (err) {
    Logger.log("Rejection log error: " + err.toString());
  }
}

/**
 * Sanitizes input values to prevent CSV / Formula Injection in Sheets/Excel.
 */
function sanitizeForFormula(str) {
  if (!str) return "";
  var dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  var firstChar = str.charAt(0);
  if (dangerousPrefixes.indexOf(firstChar) !== -1) {
    return "'" + str;
  }
  return str;
}

/**
 * Helper to extract client IP address from request parameter or header.
 */
function extractClientIp(e) {
  if (!e) return "0.0.0.0";
  if (e.parameter && e.parameter.ip) return e.parameter.ip;
  return "127.0.0.1";
}

/**
 * Helper to build standard JSON response Output.
 */
function createJsonResponse(dataObj) {
  return ContentService.createTextOutput(JSON.stringify(dataObj))
    .setMimeType(ContentService.MimeType.JSON);
}
