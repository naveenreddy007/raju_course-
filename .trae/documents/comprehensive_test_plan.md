# Comprehensive Test Plan - AffiliateLearn Platform

## 1. Test Plan Overview

This comprehensive test plan covers all critical user flows for the AffiliateLearn platform, an affiliate learning system built with Next.js 14, featuring user authentication, course management, referral system, and commission tracking.

**Testing Scope:**
- User Authentication & Authorization
- Course Management & Purchase Workflow
- Referral System & Commission Calculation
- Content Verification & Blog System
- System Validation & Dashboard Functionality

**Test Environment:**
- Frontend: React 18 + Next.js 14 + TypeScript
- Backend: Next.js API Routes + Prisma ORM
- Database: PostgreSQL (Supabase)
- Authentication: Supabase Auth + JWT
- Payment: Razorpay Integration

---

## 2. User Authentication Testing

### 2.1 Login Process Verification

| Test Case ID | Test Scenario | Test Steps | Expected Result | Validation Criteria |
|--------------|---------------|------------|-----------------|--------------------|
| AUTH-001 | Valid User Login | 1. Navigate to `/auth/login`<br>2. Enter valid email and password<br>3. Click "Sign In" button | User successfully logged in and redirected to dashboard | - Login form accepts valid credentials<br>- JWT token generated<br>- Redirect to `/dashboard`<br>- No error messages displayed |
| AUTH-002 | Invalid Credentials | 1. Navigate to `/auth/login`<br>2. Enter invalid email/password<br>3. Click "Sign In" button | Error message displayed, user remains on login page | - Error message: "Invalid credentials"<br>- Form fields remain populated<br>- No redirect occurs |
| AUTH-003 | Empty Form Submission | 1. Navigate to `/auth/login`<br>2. Leave fields empty<br>3. Click "Sign In" button | Form validation prevents submission | - Required field validation active<br>- Browser validation messages shown<br>- Submit button disabled or validation errors |
| AUTH-004 | Password Visibility Toggle | 1. Navigate to `/auth/login`<br>2. Enter password<br>3. Click eye icon to toggle visibility | Password visibility toggles correctly | - Eye icon changes between Eye/EyeOff<br>- Input type changes between password/text<br>- Password content visible/hidden |

### 2.2 Dashboard Accessibility Post-Login

| Test Case ID | Test Scenario | Test Steps | Expected Result | Validation Criteria |
|--------------|---------------|------------|-----------------|--------------------|
| DASH-001 | Dashboard Access After Login | 1. Complete successful login<br>2. Verify dashboard loads | Dashboard displays user-specific data | - Welcome message with user name<br>- Stats cards show correct data<br>- Navigation menu accessible<br>- User profile data loaded |
| DASH-002 | Protected Route Access | 1. Access `/dashboard` without login<br>2. Verify redirect behavior | Redirected to login page | - Automatic redirect to `/auth/login`<br>- Return URL preserved for post-login redirect |
| DASH-003 | Session Persistence | 1. Login successfully<br>2. Refresh browser<br>3. Navigate to dashboard | User remains logged in | - JWT token persists in storage<br>- Dashboard accessible without re-login<br>- User data maintained |

---

## 3. Course Management Testing

### 3.1 Course Catalog Visibility

| Test Case ID | Test Scenario | Test Steps | Expected Result | Validation Criteria |
|--------------|---------------|------------|-----------------|--------------------|
| COURSE-001 | Course Catalog Loading | 1. Navigate to `/courses`<br>2. Verify course list displays | Course catalog loads with available courses | - Course cards display properly<br>- Course thumbnails, titles, descriptions visible<br>- Filter and search functionality present |
| COURSE-002 | Course Search Functionality | 1. Navigate to `/courses`<br>2. Enter search term in search box<br>3. Verify filtered results | Courses filtered based on search criteria | - Search results update in real-time<br>- Matching courses displayed<br>- Result count updated |
| COURSE-003 | Course Category Filtering | 1. Navigate to `/courses`<br>2. Select category from dropdown<br>3. Verify filtered results | Courses filtered by selected category | - Only courses in selected category shown<br>- Filter dropdown shows selected value<br>- Result count reflects filtered data |

### 3.2 Course Purchase Workflow

| Test Case ID | Test Scenario | Test Steps | Expected Result | Validation Criteria |
|--------------|---------------|------------|-----------------|--------------------|
| PURCHASE-001 | Package Selection | 1. Navigate to `/purchase`<br>2. Select Silver/Gold/Platinum package<br>3. Verify package details | Package selected with correct pricing and features | - Package card highlighted when selected<br>- Price and features displayed correctly<br>- Commission rates shown accurately |
| PURCHASE-002 | Razorpay Payment Integration | 1. Select package<br>2. Click purchase button<br>3. Complete Razorpay payment flow | Payment processed successfully | - Razorpay modal opens<br>- Payment details pre-filled<br>- Payment confirmation received<br>- Redirect to success page |
| PURCHASE-003 | Payment Success Handling | 1. Complete successful payment<br>2. Verify success page<br>3. Check user package upgrade | User package updated, success confirmation shown | - Success page displays transaction details<br>- User affiliate record updated with new package<br>- Course access granted based on package |
| PURCHASE-004 | Payment Failure Handling | 1. Initiate payment<br>2. Cancel or fail payment<br>3. Verify error handling | Appropriate error handling and user feedback | - Redirect to failure page<br>- Error message displayed<br>- User package remains unchanged |

### 3.3 Course Progress Tracking

| Test Case ID | Test Scenario | Test Steps | Expected Result | Validation Criteria |
|--------------|---------------|------------|-----------------|--------------------|
| PROGRESS-001 | Course Access Verification | 1. Login with purchased package<br>2. Navigate to course content<br>3. Verify access permissions | User can access courses based on package level | - Course content accessible<br>- Video/module playback functional<br>- Progress tracking initiated |
| PROGRESS-002 | Progress Monitoring | 1. Start watching course content<br>2. Navigate through modules<br>3. Check progress updates | Course progress tracked and displayed | - Progress percentage updates<br>- Completed modules marked<br>- Watch time recorded accurately |
| PROGRESS-003 | Course Completion | 1. Complete all course modules<br>2. Verify completion status<br>3. Check certificate/achievement | Course marked as completed | - 100% progress shown<br>- Completion status updated<br>- Achievement/certificate generated |

---

## 4. Referral System Testing

### 4.1 Referral Link Generation

| Test Case ID | Test Scenario | Test Steps | Expected Result | Validation Criteria |
|--------------|---------------|------------|-----------------|--------------------|
| REF-001 | Referral Code Generation | 1. Login to dashboard<br>2. Navigate to `/dashboard/referrals`<br>3. Verify referral code and link | Unique referral code and link generated | - Referral code format: USER + 6 chars<br>- Referral link includes domain + ref parameter<br>- Copy functionality works |
| REF-002 | Referral Link Sharing | 1. Copy referral link<br>2. Test share functionality<br>3. Verify link format | Referral link can be shared via multiple channels | - Copy to clipboard works<br>- Native share API functional (mobile)<br>- Link format: `/auth/register?ref=USERXXXXXX` |

### 4.2 New User Registration via Referral

| Test Case ID | Test Scenario | Test Steps | Expected Result | Validation Criteria |
|--------------|---------------|------------|-----------------|--------------------|
| REF-003 | Referral Link Registration | 1. Open referral link in new browser<br>2. Complete registration form<br>3. Verify referral connection | New user registered with referral connection | - Referral code pre-filled in form<br>- User created with parent affiliate link<br>- Referral record created in database |
| REF-004 | Invalid Referral Code | 1. Use invalid referral code<br>2. Attempt registration<br>3. Verify error handling | Registration fails with appropriate error | - Error message: "Invalid referral code"<br>- Registration process halted<br>- User prompted to correct or remove code |

### 4.3 Commission Calculation and Display

| Test Case ID | Test Scenario | Test Steps | Expected Result | Validation Criteria |
|--------------|---------------|------------|-----------------|--------------------|
| COMM-001 | Direct Commission Calculation | 1. Referred user purchases package<br>2. Check referrer's earnings<br>3. Verify commission amount | Direct commission calculated and credited | - Commission rate: 10% of package price<br>- Amount credited to referrer balance<br>- Transaction record created |
| COMM-002 | Indirect Commission Calculation | 1. Second-level referral makes purchase<br>2. Check first-level referrer earnings<br>3. Verify indirect commission | Indirect commission calculated correctly | - Indirect commission rate applied<br>- Multi-level commission structure working<br>- Both direct and indirect earnings tracked |
| COMM-003 | Earnings Dashboard Display | 1. Navigate to `/dashboard/earnings`<br>2. Verify earnings breakdown<br>3. Check calculation accuracy | Earnings displayed accurately with breakdown | - Total earnings = direct + indirect<br>- Available balance shown<br>- Withdrawal history displayed |

### 4.4 Multi-User Referral Testing (4 Distinct Users)

| Test Case ID | Test Scenario | Test Steps | Expected Result | Validation Criteria |
|--------------|---------------|------------|-----------------|--------------------|
| REF-MULTI-001 | User A Refers User B | 1. User A shares referral link<br>2. User B registers via link<br>3. User B purchases Silver package | User A earns direct commission from User B | - User B linked to User A as parent<br>- Direct commission calculated<br>- Referral count incremented |
| REF-MULTI-002 | User B Refers User C | 1. User B shares referral link<br>2. User C registers via User B's link<br>3. User C purchases Gold package | User B earns direct commission, User A earns indirect | - User C linked to User B as parent<br>- User B gets direct commission<br>- User A gets indirect commission |
| REF-MULTI-003 | User A Refers User D | 1. User A shares referral link<br>2. User D registers via link<br>3. User D purchases Platinum package | User A earns additional direct commission | - User D linked to User A as parent<br>- User A's total referrals = 2 (B + D)<br>- Commission calculations accurate |
| REF-MULTI-004 | User C Refers User E | 1. User C shares referral link<br>2. User E registers via User C's link<br>3. User E purchases Silver package | Multi-level commission distribution | - User C gets direct commission<br>- User B gets indirect commission<br>- User A gets second-level indirect (if applicable) |

---

## 5. Content Verification Testing

### 5.1 Blog Section Visibility

| Test Case ID | Test Scenario | Test Steps | Expected Result | Validation Criteria |
|--------------|---------------|------------|-----------------|--------------------|
| BLOG-001 | Blog Page Loading | 1. Navigate to `/blog`<br>2. Verify blog posts display<br>3. Check layout and functionality | Blog section loads with articles and navigation | - Blog posts grid displays<br>- Search and filter functionality present<br>- Article previews show correctly |
| BLOG-002 | Blog Search Functionality | 1. Enter search term in blog search<br>2. Verify filtered results<br>3. Test different search terms | Blog articles filtered based on search | - Search results update dynamically<br>- Matching articles highlighted<br>- No results message when applicable |
| BLOG-003 | Blog Category Filtering | 1. Select category from filter dropdown<br>2. Verify filtered articles<br>3. Test multiple categories | Articles filtered by selected category | - Only articles in category shown<br>- Category filter state maintained<br>- Result count updated |

### 5.2 Social Media Sharing Functionality

| Test Case ID | Test Scenario | Test Steps | Expected Result | Validation Criteria |
|--------------|---------------|------------|-----------------|--------------------|
| SHARE-001 | Blog Article Sharing | 1. Open blog article<br>2. Click share buttons<br>3. Verify sharing functionality | Article can be shared on social platforms | - Share buttons functional<br>- Correct URL and metadata shared<br>- Social media previews display properly |
| SHARE-002 | Course Sharing | 1. Navigate to course page<br>2. Use share functionality<br>3. Verify shared content | Course information shared correctly | - Course title and description included<br>- Referral link embedded if applicable<br>- Share preview accurate |

### 5.3 Course Tracking Validation

| Test Case ID | Test Scenario | Test Steps | Expected Result | Validation Criteria |
|--------------|---------------|------------|-----------------|--------------------|
| TRACK-001 | Purchased Course Visibility | 1. Login after package purchase<br>2. Navigate to courses section<br>3. Verify purchased course access | All purchased courses visible and accessible | - Course access based on package level<br>- "Purchased" or "Access Granted" indicators<br>- Course content unlocked |
| TRACK-002 | Course Progress Persistence | 1. Start course, watch partially<br>2. Logout and login again<br>3. Resume course | Course progress maintained across sessions | - Progress percentage preserved<br>- Last watched position remembered<br>- Completion status accurate |

---

## 6. System Validation Testing

### 6.1 Dashboard Elements Verification

| Test Case ID | Test Scenario | Test Steps | Expected Result | Validation Criteria |
|--------------|---------------|------------|-----------------|--------------------|
| SYS-001 | Dashboard Stats Accuracy | 1. Login to dashboard<br>2. Verify all stat cards<br>3. Cross-check with database | All dashboard statistics display correctly | - Total earnings calculation accurate<br>- Referral counts match database<br>- Course completion stats correct |
| SYS-002 | Earnings Report Accuracy | 1. Navigate to earnings section<br>2. Verify earnings breakdown<br>3. Check calculation logic | Earnings reports show accurate data | - Direct vs indirect earnings separated<br>- Available balance calculation correct<br>- Withdrawal history accurate |
| SYS-003 | Real-time Data Updates | 1. Make transaction in one browser<br>2. Refresh dashboard in another<br>3. Verify data synchronization | Dashboard data updates reflect recent changes | - Stats update after transactions<br>- Real-time or near-real-time updates<br>- Data consistency maintained |

### 6.2 Course Watch Tracking Accuracy

| Test Case ID | Test Scenario | Test Steps | Expected Result | Validation Criteria |
|--------------|---------------|------------|-----------------|--------------------|
| WATCH-001 | Video Progress Tracking | 1. Start watching course video<br>2. Pause at specific timestamp<br>3. Resume and verify position | Video progress tracked accurately | - Timestamp saved correctly<br>- Resume from exact position<br>- Progress percentage calculated properly |
| WATCH-002 | Module Completion Tracking | 1. Complete entire course module<br>2. Verify completion status<br>3. Check progress updates | Module completion tracked and displayed | - Module marked as completed<br>- Overall course progress updated<br>- Completion timestamp recorded |
| WATCH-003 | Multi-device Progress Sync | 1. Start course on desktop<br>2. Continue on mobile device<br>3. Verify progress synchronization | Progress syncs across devices | - Progress maintained across devices<br>- Last watched position synced<br>- Completion status consistent |

### 6.3 End-to-End User Flow Validation

| Test Case ID | Test Scenario | Test Steps | Expected Result | Validation Criteria |
|--------------|---------------|------------|-----------------|--------------------|
| E2E-001 | Complete New User Journey | 1. Register new account<br>2. Purchase package<br>3. Access courses<br>4. Generate referral<br>5. Track progress | Full user journey works seamlessly | - Registration to course access flow<br>- Payment integration functional<br>- Referral system operational<br>- Progress tracking accurate |
| E2E-002 | Referral Commission Flow | 1. User A refers User B<br>2. User B purchases package<br>3. Verify commission calculation<br>4. Check earnings display | Complete referral commission flow functional | - Referral link works end-to-end<br>- Commission calculated correctly<br>- Earnings reflected in dashboard<br>- Transaction records created |
| E2E-003 | Multi-level Referral Chain | 1. Create referral chain A→B→C<br>2. User C makes purchase<br>3. Verify multi-level commissions<br>4. Check all user dashboards | Multi-level commission system works correctly | - All referral relationships maintained<br>- Commission distribution accurate<br>- Dashboard updates for all users<br>- Database consistency maintained |

---

## 7. Test Execution Guidelines

### 7.1 Test Environment Setup
1. **Database**: Fresh PostgreSQL instance with test data
2. **Authentication**: Supabase test project configuration
3. **Payment**: Razorpay test mode with test credentials
4. **Email**: Test email service for notifications

### 7.2 Test Data Requirements
- **Test Users**: Minimum 5 user accounts with different roles
- **Test Packages**: All three package types (Silver, Gold, Platinum)
- **Test Courses**: Sample courses for each package level
- **Test Referral Codes**: Valid and invalid referral codes

### 7.3 Browser Compatibility
- **Desktop**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile**: Chrome Mobile, Safari Mobile, Samsung Internet
- **Responsive**: Test all breakpoints (mobile, tablet, desktop)

### 7.4 Performance Criteria
- **Page Load Time**: < 3 seconds for all pages
- **API Response Time**: < 500ms for all endpoints
- **Database Queries**: Optimized with proper indexing
- **Image Loading**: Lazy loading implemented

---

## 8. Test Reporting

### 8.1 Test Metrics
- **Total Test Cases**: 45+ test cases across all modules
- **Pass/Fail Criteria**: 100% pass rate for critical flows
- **Bug Severity**: Critical, High, Medium, Low classification
- **Test Coverage**: All major user flows covered

### 8.2 Deliverables
1. **Test Execution Report**: Detailed results for each test case
2. **Bug Report**: Issues found with severity and steps to reproduce
3. **Performance Report**: Load times and optimization recommendations
4. **Compatibility Report**: Browser and device compatibility results

### 8.3 Sign-off Criteria
- All critical and high-priority test cases pass
- No critical or high-severity bugs remain
- Performance benchmarks met
- Cross-browser compatibility verified
- User acceptance testing completed

---

## 9. Risk Assessment

### 9.1 High-Risk Areas
- **Payment Integration**: Razorpay payment failures
- **Commission Calculation**: Incorrect commission amounts
- **Referral Tracking**: Lost referral relationships
- **Data Consistency**: Database synchronization issues

### 9.2 Mitigation Strategies
- **Payment Testing**: Extensive testing with various payment scenarios
- **Commission Validation**: Automated calculation verification
- **Referral Monitoring**: Real-time referral relationship tracking
- **Data Backup**: Regular database backups and rollback procedures

---

*This comprehensive test plan ensures thorough validation of all user flows in the AffiliateLearn platform. Execute all test cases systematically and document results for quality assurance.*