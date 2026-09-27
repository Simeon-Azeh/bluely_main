export type Resource = {
    slug: string;
    category: string;
    title: string;
    summary: string;
    readTime: string;
    sections: { heading: string; paragraphs: string[]; bullets?: string[] }[];
    sources: { label: string; url: string }[];
};

// Editorial summaries grounded in the linked NIDDK, CDC and ADA resources. Review with a clinician before expanding into medical guidance.
export const resources: Resource[] = [
    {
        slug: 'understanding-type-1-diabetes',
        category: 'DIABETES 101',
        title: 'Understanding Type 1 Diabetes',
        summary: 'A clear starting point for understanding what Type 1 diabetes is and why support matters.',
        readTime: '3 min read',
        sections: [
            { heading: 'What is Type 1 diabetes?', paragraphs: ['Type 1 diabetes happens when the immune system damages the cells in the pancreas that make insulin. Insulin helps glucose move from the blood into the body’s cells for energy. Without enough insulin, glucose builds up in the blood.', 'Type 1 diabetes can begin at any age, although it often appears in children, teenagers and young adults. It is not caused by eating sugar or by a personal failure.'] },
            { heading: 'What does everyday care involve?', paragraphs: ['People with Type 1 diabetes need insulin. Day-to-day care also involves checking glucose, noticing how food and activity affect it, and working with a health care team on a personal care plan. The details of that plan differ from person to person.', 'Learning what the numbers mean is a process. Questions are welcome, and the person living with diabetes should have a voice in conversations about their care.'] },
            { heading: 'When to seek help', paragraphs: ['Frequent urination, unusual thirst and unexplained weight loss can be signs of diabetes. If these symptoms appear, especially in a child or teenager, seek medical assessment promptly. A health professional can diagnose diabetes and explain the next steps.'] },
        ],
        sources: [
            { label: 'NIDDK: Type 1 Diabetes', url: 'https://www.niddk.nih.gov/health-information/diabetes/overview/what-is-diabetes/type-1-diabetes' },
            { label: 'CDC: Type 1 Diabetes', url: 'https://www.cdc.gov/diabetes/about/about-type-1-diabetes.html' },
        ],
    },
    {
        slug: 'diabetes-at-school',
        category: 'EVERYDAY LIFE',
        title: 'Diabetes at school',
        summary: 'Small conversations and a clear care plan can make school feel more manageable.',
        readTime: '3 min read',
        sections: [
            { heading: 'Start with a shared plan', paragraphs: ['A student’s diabetes needs are individual. Families, the student, their health care team and the school can agree on a written plan that explains daily support, supplies, signs of low or high glucose, and whom to contact when help is needed.', 'The plan should fit the student’s age, routine and level of independence. Review it when the student’s needs or school schedule changes.'] },
            { heading: 'Make everyday participation possible', paragraphs: ['Teachers and relevant staff should know what support the student needs during classes, meals, sports, trips and exams. A young person should be able to take part in school life while having practical access to their agreed care.', 'Ask the student how they want to discuss diabetes with friends or classmates. Their privacy and preferences matter.'] },
            { heading: 'Keep communication open', paragraphs: ['Check in with the student rather than making assumptions about what they can do independently. If there are concerns about care at school, bring the student, family, school and health care team together to update the plan. Local school policies vary, so use the care team’s guidance for medical details.'] },
        ],
        sources: [
            { label: 'CDC: Managing Diabetes at School', url: 'https://www.cdc.gov/diabetes/caring/managing-diabetes-at-school.html' },
            { label: 'American Diabetes Association: Diabetes Medical Management Plan', url: 'https://diabetes.org/advocacy/safe-at-school-state-laws/diabetes-medical-management-plan' },
        ],
    },
    {
        slug: 'supporting-someone-with-t1d',
        category: 'FOR FAMILIES',
        title: 'Supporting someone living with T1D',
        summary: 'Practical support begins with listening, learning and respecting growing independence.',
        readTime: '3 min read',
        sections: [
            { heading: 'Ask what support is useful', paragraphs: ['Living with Type 1 diabetes asks for attention every day, but the person living with it remains much more than their condition. Ask how you can help and listen to the answer. Support may mean joining a clinic visit, helping with supplies, or simply making room to talk.'] },
            { heading: 'Learn together', paragraphs: ['Families can learn the person’s care plan with their permission, including when to contact the health care team and what support is needed at school or at home. A diabetes educator or clinician can help families understand the practical parts of care.', 'As teenagers grow, they often want more say in their routines. Staying available while respecting that independence can make conversations easier.'] },
            { heading: 'Notice the emotional side', paragraphs: ['Diabetes can feel tiring or isolating. Encourage conversation without judging individual readings. If someone seems distressed or overwhelmed, ask their health care team about additional support. Families do not have to work everything out alone.'] },
        ],
        sources: [
            { label: 'CDC: Helping Friends and Family With Diabetes', url: 'https://www.cdc.gov/diabetes/caring/index.html' },
            { label: 'CDC: 3 Ways to Help Manage Your Child’s Type 1 Diabetes', url: 'https://www.cdc.gov/diabetes/caring/3-ways-help-manage-childs-type-1.html' },
        ],
    },
];
