import type { CompactWord } from './compact-format'

// SGK Tiếng Anh 12 - Theme-based vocabulary
export const sgk12Data: CompactWord[] = [
  // Unit 1: Life Stories
  { w: 'biography', ipa: '/baɪˈɒɡrəfi/', pos: 'noun', vi: 'tiểu sử', en: 'an account of someone\'s life', ex: 'I read a biography of Uncle Ho.', tags: ['sgk12', 'stories'], diff: 3 },
  { w: 'achievement', ipa: '/əˈtʃiːvmənt/', pos: 'noun', vi: 'thành tựu', en: 'a thing done successfully', ex: 'Her achievements are impressive.', syn: ['accomplishment'], tags: ['sgk12', 'stories'], diff: 2 },
  { w: 'determination', ipa: '/dɪˌtɜːmɪˈneɪʃn/', pos: 'noun', vi: 'sự quyết tâm', en: 'firmness of purpose', ex: 'His determination led to success.', tags: ['sgk12', 'stories'], diff: 2 },
  { w: 'talented', ipa: '/ˈtæləntɪd/', pos: 'adjective', vi: 'tài năng', en: 'having natural skill or ability', ex: 'She is a talented artist.', tags: ['sgk12', 'stories'], diff: 2 },

  // Unit 2: Urbanisation
  { w: 'urban', ipa: '/ˈɜːbən/', pos: 'adjective', vi: 'thuộc đô thị', en: 'relating to a city', ex: 'Urban areas are expanding.', tags: ['sgk12', 'urban'], diff: 2 },
  { w: 'migration', ipa: '/maɪˈɡreɪʃn/', pos: 'noun', vi: 'di cư', en: 'movement of people from one place to another', ex: 'Rural-to-urban migration is common.', tags: ['sgk12', 'urban'], diff: 3 },
  { w: 'overcrowded', ipa: '/ˌəʊvəˈkraʊdɪd/', pos: 'adjective', vi: 'quá đông đúc', en: 'filled with too many people', ex: 'Overcrowded cities face many problems.', tags: ['sgk12', 'urban'], diff: 2 },
  { w: 'industrialization', ipa: '/ɪnˌdʌstriəlaɪˈzeɪʃn/', pos: 'noun', vi: 'công nghiệp hóa', en: 'the development of industries', ex: 'Industrialization changed the economy.', tags: ['sgk12', 'urban'], diff: 4 },

  // Unit 3: The Green Movement
  { w: 'environmental', ipa: '/ɪnˌvaɪrənˈmentl/', pos: 'adjective', vi: 'thuộc môi trường', en: 'relating to the environment', ex: 'Environmental issues need attention.', tags: ['sgk12', 'green'], diff: 2 },
  { w: 'recycle', ipa: '/ˌriːˈsaɪkl/', pos: 'verb', vi: 'tái chế', en: 'to convert waste into reusable material', ex: 'We should recycle plastic bottles.', tags: ['sgk12', 'green'], diff: 2 },
  { w: 'conservation', ipa: '/ˌkɒnsəˈveɪʃn/', pos: 'noun', vi: 'bảo tồn', en: 'the protection of natural resources', ex: 'Wildlife conservation is critical.', tags: ['sgk12', 'green'], diff: 3 },
  { w: 'renewable', ipa: '/rɪˈnjuːəbl/', pos: 'adjective', vi: 'tái tạo', en: 'capable of being renewed', ex: 'Solar energy is renewable.', tags: ['sgk12', 'green'], diff: 3 },

  // Unit 4: The Mass Media
  { w: 'publish', ipa: '/ˈpʌblɪʃ/', pos: 'verb', vi: 'xuất bản', en: 'to make content available to the public', ex: 'The article was published online.', tags: ['sgk12', 'media'], diff: 2 },
  { w: 'journalist', ipa: '/ˈdʒɜːnəlɪst/', pos: 'noun', vi: 'nhà báo', en: 'a person who writes for newspapers', ex: 'Journalists report the news.', tags: ['sgk12', 'media'], diff: 2 },
  { w: 'coverage', ipa: '/ˈkʌvərɪdʒ/', pos: 'noun', vi: 'sự đưa tin', en: 'the reporting of news', ex: 'The event received wide coverage.', tags: ['sgk12', 'media'], diff: 3 },
  { w: 'reliable', ipa: '/rɪˈlaɪəbl/', pos: 'adjective', vi: 'đáng tin cậy', en: 'able to be trusted', ex: 'Find reliable news sources.', tags: ['sgk12', 'media'], diff: 2 },

  // Unit 5: Cultural Identity
  { w: 'identity', ipa: '/aɪˈdentəti/', pos: 'noun', vi: 'bản sắc', en: 'the characteristics that define someone', ex: 'Cultural identity is important.', tags: ['sgk12', 'culture'], diff: 3 },
  { w: 'cultural', ipa: '/ˈkʌltʃərəl/', pos: 'adjective', vi: 'thuộc văn hóa', en: 'relating to the culture', ex: 'Cultural diversity is valuable.', tags: ['sgk12', 'culture'], diff: 2 },
  { w: 'assimilate', ipa: '/əˈsɪməleɪt/', pos: 'verb', vi: 'đồng hóa', en: 'to absorb into a culture', ex: 'Immigrants assimilate into society.', tags: ['sgk12', 'culture'], diff: 4 },
  { w: 'custom', ipa: '/ˈkʌstəm/', pos: 'noun', vi: 'phong tục', en: 'a traditional practice', ex: 'Local customs should be respected.', tags: ['sgk12', 'culture'], diff: 2 },

  // Unit 6: Endangered Species
  { w: 'endangered', ipa: '/ɪnˈdeɪndʒərd/', pos: 'adjective', vi: 'có nguy cơ tuyệt chủng', en: 'at risk of extinction', ex: 'Many species are endangered.', tags: ['sgk12', 'species'], diff: 3 },
  { w: 'extinction', ipa: '/ɪkˈstɪŋkʃn/', pos: 'noun', vi: 'tuyệt chủng', en: 'the dying out of a species', ex: 'Habitat loss causes extinction.', tags: ['sgk12', 'species'], diff: 3 },
  { w: 'habitat', ipa: '/ˈhæbɪtæt/', pos: 'noun', vi: 'môi trường sống', en: 'the natural home of an animal', ex: 'Protecting natural habitats is vital.', tags: ['sgk12', 'species'], diff: 3 },
  { w: 'biodiversity', ipa: '/ˌbaɪəʊdaɪˈvɜːrsəti/', pos: 'noun', vi: 'đa dạng sinh học', en: 'the variety of life in a habitat', ex: 'Tropical forests have high biodiversity.', tags: ['sgk12', 'species'], diff: 4 },

  // Unit 7: Artificial Intelligence
  { w: 'artificial', ipa: '/ˌɑːrtɪˈfɪʃl/', pos: 'adjective', vi: 'nhân tạo', en: 'made by human skill', ex: 'Artificial intelligence is advancing.', tags: ['sgk12', 'ai'], diff: 3 },
  { w: 'algorithm', ipa: '/ˈælɡərɪðəm/', pos: 'noun', vi: 'thuật toán', en: 'a process or set of rules to follow', ex: 'The algorithm analyzes data.', tags: ['sgk12', 'ai'], diff: 4 },
  { w: 'automation', ipa: '/ˌɔːtəˈmeɪʃn/', pos: 'noun', vi: 'tự động hóa', en: 'the use of automatic equipment', ex: 'Automation replaces human labor.', tags: ['sgk12', 'ai'], diff: 3 },
  { w: 'robot', ipa: '/ˈrəʊbɒt/', pos: 'noun', vi: 'người máy', en: 'a machine capable of carrying out actions', ex: 'Robots are used in manufacturing.', tags: ['sgk12', 'ai'], diff: 2 },

  // Unit 8: The World of Work
  { w: 'occupation', ipa: '/ˌɒkjuˈpeɪʃn/', pos: 'noun', vi: 'nghề nghiệp', en: 'a job or profession', ex: 'Choose an occupation you enjoy.', tags: ['sgk12', 'work'], diff: 2 },
  { w: 'qualification', ipa: '/ˌkwɒlɪfɪˈkeɪʃn/', pos: 'noun', vi: 'bằng cấp', en: 'a pass of an exam or training', ex: 'Good qualifications help you get a job.', tags: ['sgk12', 'work'], diff: 2 },
  { w: 'recruit', ipa: '/rɪˈkruːt/', pos: 'verb', vi: 'tuyển dụng', en: 'to find new employees', ex: 'Companies recruit new graduates.', tags: ['sgk12', 'work'], diff: 2 },
  { w: 'apprentice', ipa: '/əˈprentɪs/', pos: 'noun', vi: 'thực tập sinh', en: 'a person learning a trade', ex: 'He started as an apprentice.', tags: ['sgk12', 'work'], diff: 3 },

  // Unit 9: Choosing a Career
  { w: 'career', ipa: '/kəˈrɪər/', pos: 'noun', vi: 'sự nghiệp', en: 'an occupation undertaken for a significant period', ex: 'She has a successful career in finance.', tags: ['sgk12', 'career'], diff: 2 },
  { w: 'interview', ipa: '/ˈɪntəvjuː/', pos: 'noun/verb', vi: 'phỏng vấn', en: 'a meeting to assess suitability', ex: 'Prepare well for the job interview.', tags: ['sgk12', 'career'], diff: 2 },
  { w: 'resume', ipa: '/rɪˈzjuːm/', pos: 'noun', vi: 'sơ yếu lý lịch', en: 'a summary of qualifications', ex: 'Send your resume to the employer.', tags: ['sgk12', 'career'], diff: 2 },
  { w: 'promotion', ipa: '/prəˈməʊʃn/', pos: 'noun', vi: 'sự thăng chức', en: 'advancement to a higher position', ex: 'She got a promotion after 2 years.', tags: ['sgk12', 'career'], diff: 2 },

  // Unit 10: Lifelong Learning
  { w: 'lifelong', ipa: '/ˈlaɪflɒŋ/', pos: 'adjective', vi: 'suốt đời', en: 'lasting through one\'s life', ex: 'Lifelong learning is essential today.', tags: ['sgk12', 'learning'], diff: 2 },
  { w: 'adapt', ipa: '/əˈdæpt/', pos: 'verb', vi: 'thích nghi', en: 'to adjust to new conditions', ex: 'We must adapt to changing technology.', tags: ['sgk12', 'learning'], diff: 2 },
  { w: 'flexible', ipa: '/ˈfleksəbl/', pos: 'adjective', vi: 'linh hoạt', en: 'able to change easily', ex: 'Flexible thinking helps problem-solving.', tags: ['sgk12', 'learning'], diff: 2 },
  { w: 'skill', ipa: '/skɪl/', pos: 'noun', vi: 'kỹ năng', en: 'the ability to do something well', ex: 'Communication skills are vital.', tags: ['sgk12', 'learning'], diff: 1 },
]
