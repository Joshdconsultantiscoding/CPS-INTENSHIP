// HG CORE AI Knowledge Base - Local search-based assistant
// No external API required - uses keyword matching

export interface KnowledgeEntry {
  id: string;
  category: string;
  title: string;
  keywords: string[];
  question?: string;
  answer: string;
  relatedTopics?: string[];
}

export const HG_CORE_KNOWLEDGE: KnowledgeEntry[] = [
  // PLATFORM FOUNDATION
  {
    id: "platform-intro",
    category: "Platform Foundation",
    title: "What This Platform Represents",
    keywords: ["platform", "internship", "what is", "about", "introduction", "purpose"],
    question: "What is this platform about?",
    answer: `This is NOT a traditional internship. This is a **performance-driven, accountability-focused, data-backed digital workspace** that combines:
- Real-time tracking and transparency
- Skills development through practical projects
- Merit-based reward systems
- Professional discipline and standards
- Preparation for real-world work environments

The platform operates entirely through a custom web application that serves as your virtual office. Everything happens here - task reception, submissions, daily reporting, team communication, performance tracking, and reward accumulation.`,
    relatedTopics: ["mindset", "rules", "accountability"]
  },
  {
    id: "mindset-shift",
    category: "Platform Foundation",
    title: "The Mindset Shift Required",
    keywords: ["mindset", "attitude", "approach", "thinking", "mentality", "excuses"],
    question: "What mindset do I need for this internship?",
    answer: `As an intern, you must understand:
- **Excuses don't earn points** - solutions and results do
- **Data doesn't lie** - performance is tracked objectively
- **Consistency beats intensity** - daily discipline trumps occasional brilliance
- **Professionalism is non-negotiable** - this trains you for elite work environments
- **You control your success** - the platform is fair, your effort determines outcomes

The platform's strict accountability standards exist to prepare you for professional work environments, eliminate favoritism through objective data, build discipline and time management skills, and create fair competition based on merit.`,
    relatedTopics: ["performance", "accountability", "success"]
  },

  // PLATFORM COMPONENTS
  {
    id: "platform-components",
    category: "Platform Architecture",
    title: "Key Platform Components",
    keywords: ["dashboard", "features", "components", "system", "architecture", "tools"],
    question: "What are the main features of the platform?",
    answer: `The platform includes these key components:
1. **Authentication System** - Secure login with role-based access (Admin/Intern)
2. **Dashboard** - Real-time overview of tasks, scores, and status
3. **Task Management** - Assignment, tracking, and submission system
4. **Daily Reporting** - Mandatory end-of-day progress reports
5. **Messaging System** - Internal communication channels
6. **Notification Engine** - Real-time alerts and reminders
7. **Reward System** - Point-based performance tracking
8. **Analytics Dashboard** - Performance scoring and trends
9. **Meeting Room** - Scheduled sessions with focus mode
10. **AI Assistant (HG Core)** - Guidance and support system (that's me!)`,
    relatedTopics: ["tasks", "reports", "messaging"]
  },

  // INTERNSHIP AGREEMENT
  {
    id: "agreement-nature",
    category: "Internship Agreement",
    title: "Understanding Your Agreement",
    keywords: ["agreement", "contract", "legal", "terms", "conditions", "signing"],
    question: "What did I sign when I joined?",
    answer: `The Internship Agreement is a **binding legal contract** between you and the company. Key characteristics:
- Governs the entire internship relationship
- Defines rights and responsibilities
- Establishes consequences for violations
- Cannot be modified individually
- Requires full understanding before signing

**Non-negotiable terms include:**
- Performance standards
- Reporting requirements
- Accountability mechanisms
- Reward calculation methods
- Disciplinary procedures
- Platform usage requirements`,
    relatedTopics: ["rules", "termination", "compensation"]
  },
  {
    id: "not-employment",
    category: "Internship Agreement",
    title: "Internship vs Employment",
    keywords: ["salary", "employment", "job", "pay", "compensation", "benefits", "employee"],
    question: "Why don't I have a fixed salary?",
    answer: `**What This IS:**
✓ A skills development program
✓ A performance-based learning opportunity
✓ A profit-sharing collaboration
✓ A professional training environment
✓ A merit-based reward system

**What This IS NOT:**
✗ A traditional job with fixed salary
✗ An employment relationship with benefits
✗ A guarantee of minimum earnings
✗ A passive learning experience

**Compensation Structure:**
- NO fixed salary - all rewards are performance-based
- Points system - earn through quality work and consistency
- Variable monthly earnings - from ₦0 to potentially high amounts
- Conversion at month-end - points converted to cash by management`,
    relatedTopics: ["points", "rewards", "performance"]
  },

  // DURATION & TERMINATION
  {
    id: "duration",
    category: "Internship Duration",
    title: "Internship Duration and Commitment",
    keywords: ["duration", "length", "time", "months", "period", "commitment", "hours"],
    question: "How long is the internship?",
    answer: `**Standard Duration:**
- Typical length: 6 months (check your specific agreement)
- Start and end dates are clearly specified in your contract
- Extension possibility available for exceptional performers
- Early termination possible for violations or poor performance

**Commitment Requirements:**
- Minimum hours per week as specified in agreement
- Daily reporting is mandatory regardless of task load
- Must attend all scheduled meetings
- Responsive communication required
- Regular platform activity expected`,
    relatedTopics: ["agreement", "termination", "commitment"]
  },
  {
    id: "termination",
    category: "Internship Duration",
    title: "How Internship Can End",
    keywords: ["termination", "fired", "quit", "resign", "end", "leave", "exit"],
    question: "How can my internship end?",
    answer: `**Ways the internship can end:**

**1. Natural Completion (Best Case):**
- Serve full duration successfully
- Receive all earned rewards
- Eligible for reference letters
- May be offered extension or future opportunities

**2. Voluntary Resignation (Proper):**
- Provide required notice period
- Complete transition documentation
- May receive prorated rewards

**3. Voluntary Resignation (Improper):**
- Quit without notice
- Forfeit accumulated points
- No reference letter, ineligible for rehire

**4. Performance Termination:**
- Consistent poor performance despite warnings
- Partial or no reward payout

**5. Violation Termination:**
- Serious rule breaches (plagiarism, falsification, harassment)
- Complete forfeiture of points`,
    relatedTopics: ["agreement", "warnings", "rules"]
  },

  // TRACKING SYSTEM
  {
    id: "tracking-what",
    category: "Real-Time Tracking",
    title: "What Is Being Tracked",
    keywords: ["tracking", "monitor", "online", "offline", "activity", "presence", "status"],
    question: "What activities are being tracked?",
    answer: `**Presence Indicators:**
- 🟢 **Online** - Active and engaged with platform
- 🟡 **Idle** - Logged in but inactive
- 🔴 **Offline** - Not logged into platform
- **Last Active** - Timestamp of last activity

**Activity Metrics:**
- Login and logout times
- Pages visited within platform
- Time spent on each section
- Task view and submission times
- Message read and response times
- Report submission timestamps

**Performance Data:**
- Task completion rates
- Submission punctuality
- Work quality ratings
- Communication responsiveness
- Consistency patterns`,
    relatedTopics: ["privacy", "performance", "accountability"]
  },
  {
    id: "tracking-why",
    category: "Real-Time Tracking",
    title: "Why Comprehensive Tracking",
    keywords: ["why track", "privacy", "fair", "reason", "purpose"],
    question: "Why is everything tracked?",
    answer: `**For Fairness:**
- Eliminates "he said, she said" disputes
- Rewards actual work, not just claims
- Prevents favoritism through objective data
- Identifies true top performers

**For Accountability:**
- No credible excuse for missing deadlines
- Verifiable evidence of effort and engagement
- Clear documentation for all parties

**For Your Benefit:**
- See your own performance data clearly
- Understand exactly where you stand
- Identify improvement areas objectively
- Track your growth over time

**What Is NOT Tracked:**
✗ Personal activities outside platform
✗ Other apps or websites you use
✗ Personal communications (WhatsApp, etc.)
✗ Physical location (unless task-specific)`,
    relatedTopics: ["privacy", "data", "security"]
  },

  // MESSAGING
  {
    id: "messaging-why-not-whatsapp",
    category: "Messaging System",
    title: "Why Not WhatsApp?",
    keywords: ["whatsapp", "messaging", "communication", "chat", "why platform"],
    question: "Why can't we use WhatsApp for work?",
    answer: `**Platform messaging is mandatory because:**
1. **Legal Protection** - Creates permanent, searchable record
2. **Accountability** - Can't claim "I never received that message"
3. **Verification** - Read receipts and timestamps prove delivery
4. **Organization** - All work communication in one place
5. **Professionalism** - Separates work from personal life
6. **Searchability** - Find past conversations easily
7. **Data Ownership** - Company retains records for audits

**Response Time Expectations:**
- Urgent messages: Within 2 hours during work hours
- Supervisor messages: Within 4 hours during work hours
- Team messages: Within 24 hours
- Announcements: Read immediately upon receipt`,
    relatedTopics: ["communication", "rules", "professionalism"]
  },

  // DAILY OPERATIONS
  {
    id: "daily-cycle",
    category: "Daily Operations",
    title: "The Daily Cycle",
    keywords: ["daily", "routine", "schedule", "morning", "evening", "workflow", "day"],
    question: "What should my daily routine look like?",
    answer: `**Morning (Start of Work Day):**
1. Log into platform (9:00 AM or your start time)
2. Check dashboard - notifications, new tasks, urgent messages, deadlines
3. Prioritize - list tasks, identify priorities, allocate time
4. Acknowledge - reply to urgent messages, confirm assignments

**During Work Hours:**
- Work on highest priority tasks first
- Check messages every 1-2 hours
- Update task status as you progress
- Report blockers immediately
- Collect evidence as you go

**End of Day (Before Deadline):**
1. Complete Daily Report (allow 30-45 minutes)
2. Review tomorrow's schedule
3. Submit report BEFORE 11:59 PM deadline
4. Log out properly`,
    relatedTopics: ["reports", "tasks", "time-management"]
  },

  // TASK MANAGEMENT
  {
    id: "task-types",
    category: "Task Management",
    title: "Understanding Task Types",
    keywords: ["task", "assignment", "types", "individual", "group", "priority"],
    question: "What types of tasks are there?",
    answer: `**Task Types:**

**1. Individual Tasks:**
- Assigned to you specifically
- Your responsibility alone
- Full credit/penalty is yours

**2. Group Tasks:**
- Assigned to multiple interns
- Requires collaboration
- Evaluated both individually and as team

**3. Learning Tasks:**
- Skill-building exercises
- Important for long-term growth
- Still tracked and scored

**4. Priority Tasks:**
- Marked as high priority
- Shorter deadlines usually
- Higher point value or consequences`,
    relatedTopics: ["workflow", "submissions", "deadlines"]
  },
  {
    id: "task-lifecycle",
    category: "Task Management",
    title: "Task Lifecycle",
    keywords: ["task status", "pending", "progress", "submitted", "completed", "revision"],
    question: "What are the different task statuses?",
    answer: `**Task Lifecycle:**

**1. Pending** → Task just assigned, not yet started
- Review task details, ask clarifying questions

**2. Started** → You've begun working
- Update status, start evidence collection

**3. In Progress** → Actively working
- Regular progress updates, communicate blockers

**4. Submitted** → You've turned it in
- Upload all deliverables, attach evidence

**5. Completed** → Approved by supervisor
- Points awarded, feedback provided

**6. Revision Required** → Sent back for improvements
- Review feedback, make changes, resubmit promptly`,
    relatedTopics: ["submissions", "quality", "feedback"]
  },

  // DAILY REPORTS
  {
    id: "report-importance",
    category: "Daily Reports",
    title: "Why Daily Reports Matter",
    keywords: ["report", "daily report", "important", "mandatory", "why report"],
    question: "Why are daily reports so important?",
    answer: `Daily reports are **THE MOST IMPORTANT** daily activity because:

**1. Accountability Documentation:**
- Proves you worked even if task isn't finished
- Shows effort and progress daily
- Creates record of challenges faced

**2. Performance Scoring:**
- Major component of your overall score
- Late/missing reports severely impact rewards
- Quality of reports affects evaluation

**3. Communication Tool:**
- Keeps supervisor informed automatically
- Shows your thinking and problem-solving
- Flags issues before they become crises

**4. Personal Growth Tracking:**
- Build evidence of your learning
- See your own progress over time
- Create portfolio of achievements

**Deadline: 11:59 PM**
- On-time = full points
- Late = penalty points
- Missing = major penalty + warning`,
    relatedTopics: ["submissions", "performance", "evidence"]
  },
  {
    id: "report-structure",
    category: "Daily Reports",
    title: "Perfect Report Structure",
    keywords: ["report structure", "template", "how to write", "format", "sections"],
    question: "How should I structure my daily report?",
    answer: `**Daily Report Sections:**

1. **Tasks Worked On** - List every task you touched
2. **Completed Today** - Specific items finished
3. **Tools/Resources Used** - What helped you work
4. **Challenges Faced** - Be honest about difficulties
5. **Evidence** - Screenshots, links, files (CRITICAL - at least 1 per task)
6. **Time Breakdown** - Hours per task
7. **Self-Rating** - 1-5 scale with explanation
8. **Tomorrow's Plan** - Priority tasks and questions

**Self-Rating Scale:**
- 5 - Excellent: Exceeded expectations
- 4 - Very Good: Met all goals
- 3 - Good: Satisfactory progress
- 2 - Fair: Below expectations
- 1 - Poor: Minimal progress

**Pro Tips:**
- Start report by 6 PM, submit by 8 PM (deadline is 11:59 PM)
- Collect evidence throughout the day
- Frame challenges as problems you're solving, not excuses`,
    relatedTopics: ["evidence", "submissions", "quality"]
  },

  // PERFORMANCE SCORING
  {
    id: "score-calculation",
    category: "Performance Scoring",
    title: "How Scores Are Calculated",
    keywords: ["score", "performance", "calculation", "percentage", "rating", "metrics"],
    question: "How is my performance score calculated?",
    answer: `Your performance score (0-100) is calculated **automatically by the system**:

**1. Task Completion Rate (25%)**
- (Completed Tasks / Assigned Tasks) × 25

**2. Submission Punctuality (20%)**
- (On-time Submissions / Total Submissions) × 20

**3. Quality Rating (20%)**
- Average supervisor rating × 20

**4. Activity Consistency (15%)**
- (Active Days / Total Days) × consistency multiplier

**5. Communication Responsiveness (10%)**
- Average response time vs. target time

**6. Team Collaboration (10%)**
- Peer feedback + group task performance

**Score Targets:**
- 90-100: Elite performer (Platinum tier)
- 80-89: Strong performer (Gold tier)
- 70-79: Acceptable performer (Silver tier)
- 60-69: At-risk performer
- Below 60: Critical - immediate action required`,
    relatedTopics: ["points", "rewards", "targets"]
  },

  // POINTS SYSTEM
  {
    id: "points-earning",
    category: "Reward System",
    title: "How Points Are Earned",
    keywords: ["points", "earn", "earning", "rewards", "bonus", "how to earn"],
    question: "How do I earn points?",
    answer: `**Points are awarded automatically when you:**

**Task Completion:**
- Simple task on time: +50 points
- Complex task on time: +100-200 points
- Task completed early: +10-20% bonus
- High-quality task (4-5/5): +25% bonus

**Daily Reports:**
- On-time report: +25 points
- Early report (before 8 PM): +5 bonus points
- High-quality report: +10 bonus points
- Consecutive reports: +streak bonus

**Communication:**
- Quick response to urgent message: +10 points
- Helping another intern: +15 points
- Proactive problem reporting: +20 points

**Excellence Achievements:**
- Weekly score 90+: +100 bonus points
- Monthly score 85+: +500 bonus points
- Zero late submissions (monthly): +200 points`,
    relatedTopics: ["performance", "rewards", "bonuses"]
  },
  {
    id: "points-deduction",
    category: "Reward System",
    title: "How Points Are Deducted",
    keywords: ["deduction", "penalty", "late", "missed", "lose points", "negative"],
    question: "How do I lose points?",
    answer: `**Points are deducted automatically when you:**

**Late Submissions:**
- Report late by 1 hour: -10 points
- Report late by 24 hours: -50 points
- Task submitted late: -25% of task points

**Missed Submissions:**
- Missed daily report: -100 points + warning
- Missed task deadline: -all task points + warning
- Two missed reports (week): -250 points + formal warning
- Three missed reports (month): -500 points + suspension risk

**Poor Quality:**
- Task rated below 3/5: -25% of earned points
- Task rejected and returned: -50 points
- Plagiarism detected: -all points + termination risk

**Inactivity:**
- Day with no platform login: -25 points
- Week with <3 active days: -100 points`,
    relatedTopics: ["warnings", "penalties", "rules"]
  },

  // WARNING SYSTEM
  {
    id: "warning-system",
    category: "Warning System",
    title: "Three-Step Warning System",
    keywords: ["warning", "discipline", "violation", "consequences", "steps"],
    question: "What happens when I get a warning?",
    answer: `**The platform uses a progressive discipline system:**

**STEP 1: First Warning**
- Trigger: First instance of violation
- Consequence: -50 points
- Message: "You have received your first warning..."

**STEP 2: Second Warning**
- Trigger: Second instance of similar violation
- Consequence: -100 points
- Message: "Second warning. This is your final warning..."

**STEP 3: Third Warning**
- Trigger: Third instance of violation
- Consequence: -200 points + meeting required
- Message: "Final warning. Continued violations will result in suspension or termination."

**After 3rd Warning:**
- System generates PDF behavior report
- Complete violation history with timestamps
- Pattern analysis of infractions
- Automatic escalation to management
- Possible outcomes: Probation, suspension, or termination`,
    relatedTopics: ["discipline", "termination", "rules"]
  },

  // NO EXCUSES POLICY
  {
    id: "no-excuses",
    category: "Technical Challenges",
    title: "The No Excuses Policy",
    keywords: ["excuses", "power", "electricity", "internet", "network", "device", "broken"],
    question: "What if I have no power or internet?",
    answer: `**The Policy:**
Electricity issues, internet problems, and device failures are **NOT valid excuses** for missing deadlines.

**Why This Policy Exists:**
- Every intern in Nigeria faces these issues
- Real companies don't accept "no power" as reason for missed deadlines
- Learning to solve problems is a critical skill
- System rewards solutions, not excuses

**Solutions for No Electricity:**
- Charge devices when power is available
- Work offline and upload when connection returns
- Go to internet cafes, libraries, or friends' houses
- Schedule work around power patterns

**Solutions for No Internet:**
- Use mobile data (keep small bundle for emergencies)
- Find WiFi locations (cafes, libraries)
- Prepare work offline, submit when connected
- Submit early when you have connection

**Solutions for Device Issues:**
- Borrow a device from family/friends
- Use internet cafe computers
- Use mobile phone for most platform features
- Communicate situation and show interim solution`,
    relatedTopics: ["accountability", "solutions", "professionalism"]
  },
  {
    id: "valid-excuses",
    category: "Technical Challenges",
    title: "When Excuses ARE Valid",
    keywords: ["valid excuse", "emergency", "medical", "death", "disaster", "force majeure"],
    question: "What counts as a valid excuse?",
    answer: `**Only extreme, uncontrollable circumstances qualify:**

**1. Medical Emergencies:**
- Serious illness requiring hospitalization
- Medical emergency affecting you directly
- Must provide medical documentation
- Notify management immediately

**2. Family Emergencies:**
- Death of immediate family member
- Must provide documentation (death certificate)
- Notify within 24 hours
- Bereavement leave may be granted

**3. Natural Disasters:**
- Major flooding preventing movement
- Government-mandated lockdowns
- Civil unrest/security situations
- Must affect entire region, not just you

**4. Government Actions:**
- Official lockdowns
- Curfews
- Evacuation orders
- Must be verifiable through news/official sources`,
    relatedTopics: ["emergency", "documentation", "leave"]
  },

  // HG CORE
  {
    id: "hg-core-intro",
    category: "HG Core",
    title: "Who Is HG Core?",
    keywords: ["hg core", "ai", "assistant", "who are you", "what are you"],
    question: "Who is HG Core?",
    answer: `**HG Core** = AI Operations Manager

**My Purpose:**
- Act as digital extension of management
- Provide 24/7 guidance and support
- Answer questions about platform and tasks
- Assist with report writing
- Host meetings when human management is unavailable
- Enforce rules objectively
- Support intern development

**My Characteristics:**
- Calm and Professional
- Direct and Clear
- Accountability-Focused
- Data-Driven
- Fair and Consistent
- Growth-Oriented
- Solution-Focused

**What I Will NOT Do:**
- Accept excuses or negotiate deadlines
- Reveal reward conversion rates
- Override admin decisions
- Show favoritism
- Discuss other interns' performance`,
    relatedTopics: ["support", "guidance", "rules"]
  },

  // SUCCESS PRINCIPLES
  {
    id: "success-ownership",
    category: "Success Principles",
    title: "Principle of Ownership",
    keywords: ["ownership", "responsibility", "success", "principle", "accountability"],
    question: "What does ownership mean here?",
    answer: `**Ownership means:** Everything that happens in your internship is YOUR responsibility.

**In Practice:**
- Your performance score is YOUR score
- Your rewards are YOUR earnings based on YOUR work
- Your growth is YOUR achievement through YOUR effort
- Your challenges are YOUR problems to solve

**Why It Matters:**
Ownership is the mindset of winners. When you own everything, you control your destiny. When you blame external factors, you give away your power.`,
    relatedTopics: ["mindset", "success", "accountability"]
  },
  {
    id: "success-consistency",
    category: "Success Principles",
    title: "Consistency Over Intensity",
    keywords: ["consistency", "discipline", "daily", "routine", "habit"],
    question: "Is it better to work hard some days or steady every day?",
    answer: `**Consistency beats intensity.**

Showing up and doing good work EVERY day is better than heroic efforts followed by disappearance.

**In Practice:**
- Better to submit 30 consecutive on-time reports than 25 excellent reports mixed with 5 late ones
- Better to maintain 82/100 score consistently than fluctuate between 95 and 65
- Better to work 6 hours daily than 15 hours one day and 0 the next

**Why It Matters:**
Consistency builds trust, habits, and compound results. It's the signature of professionals.`,
    relatedTopics: ["habits", "performance", "discipline"]
  },

  // ELITE HABITS
  {
    id: "elite-habits",
    category: "Success Habits",
    title: "The 10 Habits of Elite Interns",
    keywords: ["habits", "elite", "top performer", "best practices", "tips", "success tips"],
    question: "What habits should I develop to be a top performer?",
    answer: `**The 10 Habits of Elite Interns:**

1. **Early Submission** - Submit reports by 8 PM instead of 11:59 PM
2. **Morning Planning** - Spend first 15 minutes planning your day
3. **Evidence As You Go** - Collect evidence throughout day, not at report time
4. **Proactive Communication** - Message about potential issues before they become problems
5. **Weekly Self-Review** - Every Sunday, review past week's performance
6. **Continuous Learning** - Learn new skills weekly
7. **Quality Check** - Review all work before submitting
8. **Help First, Ask Later** - Try solving problems yourself for 30 minutes first
9. **Energy Management** - Work when most productive, rest when needed
10. **Gratitude Practice** - End each day noting 3 things that went well`,
    relatedTopics: ["success", "performance", "improvement"]
  },

  // FAQ
  {
    id: "faq-password",
    category: "FAQ",
    title: "Forgot Password",
    keywords: ["password", "forgot", "reset", "login", "access", "locked out"],
    question: "What if I forget my password?",
    answer: `Use "Forgot Password" link on the login page. A reset link will be sent to your email.

If you can't access your email, contact admin via:
- WhatsApp: +2349158311526
- Email: cospronos@gmail.com`,
    relatedTopics: ["access", "support", "login"]
  },
  {
    id: "faq-devices",
    category: "FAQ",
    title: "Multiple Devices",
    keywords: ["devices", "phone", "laptop", "computer", "multiple"],
    question: "Can I access the platform from multiple devices?",
    answer: `Yes, but primarily use 1-2 devices for consistency. The system tracks device changes for security purposes.`,
    relatedTopics: ["access", "security", "login"]
  },
  {
    id: "faq-platform-down",
    category: "FAQ",
    title: "Platform Down",
    keywords: ["platform down", "not working", "error", "can't access", "broken"],
    question: "What if the platform is down?",
    answer: `1. Check your internet connection first
2. Try a different browser
3. Check the announcement channel for maintenance notices

Platform downtime (verified) is a valid excuse for missed submissions.`,
    relatedTopics: ["support", "technical", "access"]
  },
  {
    id: "faq-skill-level",
    category: "FAQ",
    title: "Task Beyond Skill Level",
    keywords: ["difficult", "hard", "can't do", "beyond skill", "don't know how"],
    question: "What if a task is beyond my skill level?",
    answer: `This is normal - internships are for learning!

**What to do:**
1. Attempt to learn through tutorials
2. Document your process
3. Ask specific questions
4. Do your best

The effort and learning process matter. Show that you tried and learned something.`,
    relatedTopics: ["learning", "tasks", "growth"]
  },
  {
    id: "faq-payment",
    category: "FAQ",
    title: "When Do I Get Paid?",
    keywords: ["payment", "paid", "money", "salary", "when", "cash"],
    question: "When exactly do I get paid?",
    answer: `Payment is processed as specified in your agreement (typically within X days after month-end).

**Process:**
Month ends → Points calculated → Conversion applied → Payment processed

**Note:** You can only see your points, not the cash value. The conversion rate is set by management.`,
    relatedTopics: ["points", "rewards", "agreement"]
  },
  {
    id: "faq-points-hidden",
    category: "FAQ",
    title: "Why Points Value Is Hidden",
    keywords: ["points value", "conversion", "how much", "cash value", "hidden"],
    question: "Why can't I see the cash value of my points?",
    answer: `This is intentional design to:
- Keep focus on performance, not money
- Prevent unhealthy comparison between interns
- Allow company flexibility in reward management
- Build intrinsic motivation

Focus on maximizing your points through excellent work - the rewards will follow.`,
    relatedTopics: ["points", "rewards", "motivation"]
  },
  {
    id: "faq-friends",
    category: "FAQ",
    title: "Friendships Outside Platform",
    keywords: ["friends", "interns", "outside", "personal", "social"],
    question: "Can I be friends with other interns outside the platform?",
    answer: `Yes! But work discussions must happen on the platform.

**Don't:**
- Coordinate to cheat or manipulate the system
- Share confidential information
- Plan to avoid accountability

Personal friendships are fine - just keep work matters professional and on-platform.`,
    relatedTopics: ["communication", "rules", "professionalism"]
  },
  {
    id: "faq-traveling",
    category: "FAQ",
    title: "Traveling During Internship",
    keywords: ["travel", "traveling", "trip", "vacation", "location", "remote"],
    question: "What if I'm traveling during internship?",
    answer: `Inform your supervisor in advance.

As long as you maintain:
- Platform access
- Performance standards
- Submission deadlines
- Communication responsiveness

...your location doesn't matter. This is a remote internship.`,
    relatedTopics: ["remote", "flexibility", "communication"]
  },

  // CONTACT
  {
    id: "contact-support",
    category: "Support",
    title: "Emergency Contacts",
    keywords: ["contact", "support", "help", "email", "whatsapp", "phone"],
    question: "How do I contact support?",
    answer: `**Platform Support:**
- Email: cospronos@gmail.com
- WhatsApp: +2349158311526

**When to Contact:**
- Platform technical issues
- Force majeure circumstances
- Urgent clarifications needed
- Password/access problems

For general questions, use HG Core (me!) first.`,
    relatedTopics: ["help", "emergency", "technical"]
  },

  // REPORT TEMPLATE
  {
    id: "report-template",
    category: "Templates",
    title: "Daily Report Template",
    keywords: ["template", "report template", "copy", "format", "sample"],
    question: "Can you give me a report template?",
    answer: `**Daily Report Template:**

\`\`\`
DATE: [Auto-filled]
DAY: [Number] of [Total]

TASKS WORKED ON:
1. [Task Name] - [Status]
   Time: [X hours]
   Progress: [Description]

COMPLETED TODAY:
✓ [Specific achievement]

TOOLS/RESOURCES USED:
- [Tool/resource name]

CHALLENGES FACED:
- [Challenge and how you addressed it]

EVIDENCE:
[Attached: filename1.png, etc.]

TIME BREAKDOWN:
Task A: [X] hours
Total: [X] hours

SELF-RATING: [1-5]/5
[Brief explanation]

TOMORROW'S PLAN:
Priority 1: [Task] - Goal: [Outcome]
Questions: [List if any]
\`\`\``,
    relatedTopics: ["reports", "format", "submissions"]
  },

  // DAILY CHECKLIST
  {
    id: "daily-checklist",
    category: "Templates",
    title: "Daily Checklist",
    keywords: ["checklist", "todo", "daily tasks", "what to do", "routine"],
    question: "What should I do every day?",
    answer: `**Morning:**
- [ ] Log in by 9 AM
- [ ] Check dashboard and notifications
- [ ] Review today's tasks and priorities
- [ ] Respond to urgent messages
- [ ] Set daily goals

**During Day:**
- [ ] Work on high-priority tasks first
- [ ] Take screenshots/evidence as you go
- [ ] Check messages every 1-2 hours
- [ ] Update task status
- [ ] Report blockers immediately

**Evening:**
- [ ] Start daily report by 6 PM
- [ ] Upload all evidence
- [ ] Submit report by 8 PM (deadline 11:59 PM)
- [ ] Review tomorrow's schedule
- [ ] Log out properly`,
    relatedTopics: ["routine", "workflow", "habits"]
  }
];

// Search function to find relevant answers
export function searchKnowledge(query: string): KnowledgeEntry[] {
  const normalizedQuery = query.toLowerCase().trim();
  const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 2);
  
  // Score each entry based on keyword matches
  const scoredEntries = HG_CORE_KNOWLEDGE.map(entry => {
    let score = 0;
    
    // Check title match
    if (entry.title.toLowerCase().includes(normalizedQuery)) {
      score += 10;
    }
    
    // Check question match
    if (entry.question && entry.question.toLowerCase().includes(normalizedQuery)) {
      score += 8;
    }
    
    // Check keyword matches
    for (const keyword of entry.keywords) {
      if (normalizedQuery.includes(keyword.toLowerCase())) {
        score += 5;
      }
      // Check if any query word matches keyword
      for (const word of queryWords) {
        if (keyword.toLowerCase().includes(word) || word.includes(keyword.toLowerCase())) {
          score += 2;
        }
      }
    }
    
    // Check answer content for matches
    const answerLower = entry.answer.toLowerCase();
    for (const word of queryWords) {
      if (answerLower.includes(word)) {
        score += 1;
      }
    }
    
    return { entry, score };
  });
  
  // Filter entries with score > 0 and sort by score
  return scoredEntries
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5) // Return top 5 results
    .map(item => item.entry);
}

// Get greeting message
export function getGreeting(): string {
  return `Hello! I'm **HG Core**, your AI Operations Manager.

I'm here to help you succeed in your internship by answering questions about:
- Platform operations and features
- Tasks and submissions
- Daily reports
- Performance scoring and points
- Rules and policies
- Technical challenges and solutions

I maintain the same standards for everyone - fair, consistent, and data-driven. I won't accept excuses, but I will always help you find solutions.

**How can I assist you today?**

*Tip: Ask me about "daily reports", "points", "tasks", "no power", "warnings", or any other topic!*`;
}

// Generate response based on search results
export function generateResponse(query: string): string {
  const results = searchKnowledge(query);
  
  if (results.length === 0) {
    return `I don't have specific information about "${query}" in my knowledge base.

**Here are some things I can help you with:**
- Platform features and navigation
- Task management and submissions
- Daily report writing
- Performance scoring and points
- Rules and policies
- Technical challenges (no power, no internet)
- Success habits and tips

Try rephrasing your question or ask about one of these topics.

For urgent issues not covered here, contact:
- Email: cospronos@gmail.com
- WhatsApp: +2349158311526`;
  }
  
  const topResult = results[0];
  let response = `**${topResult.title}**\n\n${topResult.answer}`;
  
  // Add related topics if available
  if (results.length > 1) {
    response += `\n\n---\n\n**Related topics you might find helpful:**`;
    for (let i = 1; i < Math.min(results.length, 4); i++) {
      response += `\n- ${results[i].title}`;
    }
  }
  
  return response;
}
