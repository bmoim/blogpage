import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function generateBlogPost(topic: string): Promise<string> {
  const fullPrompt = `
당신은 구글 SEO(검색 엔진 최적화)와 유용한 콘텐츠 작성에 대한 깊은 이해를 가진 전문 콘텐츠 작성가입니다.
주어진 주제에 대해, 구글 검색 결과 상위 노출을 목표로 하는, E-E-A-T(경험, 전문성, 권위성, 신뢰성) 원칙을 완벽하게 준수하는 블로그 게시물을 HTML 형식으로 작성해주세요.

**--- Google SEO 최적화 작성 지침 ---**

1.  **제목 (<h1>):**
    *   주제의 핵심 키워드를 자연스럽게 포함해야 합니다.
    *   사용자의 검색 의도를 충족시키고 클릭을 유도하는 매력적인 제목으로 작성해주세요. (60자 내외)

2.  **서론 (Introduction):**
    *   독자의 흥미를 유발하는 'Hook'으로 시작하세요.
    *   글의 전체적인 내용을 요약하고, 독자가 이 글을 왜 읽어야 하는지 설명해주세요.
    *   핵심 키워드를 첫 문단 내에 자연스럽게 포함시켜주세요.

3.  **본문 (Body - <h2>, <h3>, <p>, <strong>, <ul>, <li>):**
    *   논리적인 구조를 위해 여러 개의 소제목(<h2>)으로 내용을 나누어주세요.
    *   각 섹션은 주제에 대한 깊이 있는 정보를 제공해야 합니다. 단순한 사실 나열이 아닌, '왜'와 '어떻게'를 설명하며 전문성(Expertise)을 보여주세요.
    *   필요하다면, 실제 경험(Experience)을 녹여내어 독자와의 공감대를 형성하고 신뢰를 주세요.
    *   중요한 정보나 키워드는 <strong> 태그를 사용하여 강조해주세요.
    *   가독성을 높이기 위해 문단은 3-4 문장으로 짧게 유지하고, 필요시 목록(<ul>, <li>)을 사용해주세요.

4.  **FAQ 섹션 (Frequently Asked Questions):**
    *   게시물 말미에 '자주 묻는 질문' 섹션을 <h2> 제목으로 추가해주세요.
    *   주제와 관련하여 사용자들이 궁금해할 만한 질문 3~5개를 선정하고, 명확하고 간결한 답변을 제공해주세요. (구글 'People Also Ask' 노출에 유리)
    *   각 질문은 <strong>Q. ...</strong> 형식으로 작성해주세요.

5.  **결론 (Conclusion):**
    *   글의 핵심 내용을 다시 한번 요약하고, 독자에게 가장 중요한 메시지를 전달해주세요.
    *   독자가 다음 행동을 취하도록 유도하거나(Call to Action), 생각할 거리를 던져주며 마무리해주세요.

6.  **태그 (Tags):**
    *   게시물 내용과 관련된 핵심 키워드 및 LSI 키워드 5~10개를 쉼표(,)로 구분하여 나열해주세요. (예: 키워드1, 키워드2, ...)
    *   게시물 가장 마지막에 <div> 태그로 감싸서 넣어주세요.

**--- 주제 ---**
'${topic}'

위 모든 지침을 따라 하나의 완성된 HTML 문서를 작성해주세요.
`;

  const MAX_RETRIES = 3;
  let attempt = 0;
  
  while (attempt < MAX_RETRIES) {
    try {
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: fullPrompt,
      });
      return response.text; // Success
    } catch (error) {
      attempt++;
      console.error(`Error generating content (Attempt ${attempt}/${MAX_RETRIES}):`, error);
      if (attempt >= MAX_RETRIES) {
        // All retries failed
        throw new Error("AI 콘텐츠 생성에 실패했습니다. 나중에 다시 시도해주세요.");
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  // This should not be reached, but it's a fallback.
  throw new Error("AI 콘텐츠 생성에 실패했습니다. 나중에 다시 시도해주세요.");
}
