export interface Flashcard {
  id: number;
  module: string;
  moduleColor: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const modules = [
  { name: 'Introdução à Anatomia', color: 'primary', count: 25 },
  { name: 'Sistema Esquelético', color: 'accent', count: 25 },
  { name: 'Sistemas Orgânicos', color: 'warning', count: 25 },
  { name: 'Biomedicina Clínica', color: 'destructive', count: 25 },
];

export const flashcards: Flashcard[] = [
  // Módulo 1: Introdução à Anatomia (25 cards)
  { id: 1, module: 'Introdução à Anatomia', moduleColor: 'primary', front: 'O que significa Anatomia?', back: 'Do grego Ana = em partes e Tomia = seccionar. É a ciência que estuda a forma e a estrutura dos seres.', difficulty: 'easy' },
  { id: 2, module: 'Introdução à Anatomia', moduleColor: 'primary', front: 'O que é Nomenclatura Anatômica?', back: 'Conjunto de termos empregados para designar e descrever o organismo ou suas partes.', difficulty: 'easy' },
  { id: 3, module: 'Introdução à Anatomia', moduleColor: 'primary', front: 'O que são Epônimos e por que foram abolidos?', back: 'Epônimos homenageavam cientistas (ex: Tendão de Aquiles = Tendão Calcâneo). Foram abolidos para padronizar a nomenclatura.', difficulty: 'medium' },
  { id: 4, module: 'Introdução à Anatomia', moduleColor: 'primary', front: 'Quais critérios são usados na nomenclatura atual?', back: 'Forma (M. Trapézio), Posição (Nervo Mediano), Trajeto (A. Circunflexa), Conexões (Lig. Sacroilíaco), Relação com esqueleto (A. Radial) e Função (Manguito Rotador).', difficulty: 'hard' },
  { id: 5, module: 'Introdução à Anatomia', moduleColor: 'primary', front: 'Qual a diferença entre Anatomia Macroscópica e Microscópica?', back: 'Macroscópica: estudo sem auxílio óptico. Microscópica: necessita de microscópio para estruturas invisíveis a olho nu.', difficulty: 'easy' },
  { id: 6, module: 'Introdução à Anatomia', moduleColor: 'primary', front: 'O que é Anatomia Sistêmica?', back: 'Estuda o corpo humano dividido em sistemas, analisando macro e microscopicamente o sistema de interesse.', difficulty: 'medium' },
  { id: 7, module: 'Introdução à Anatomia', moduleColor: 'primary', front: 'O que é Anatomia Topográfica?', back: 'Estuda as partes dos sistemas e suas relações recíprocas numa determinada área corpórea, dividindo o corpo em regiões.', difficulty: 'medium' },
  { id: 8, module: 'Introdução à Anatomia', moduleColor: 'primary', front: 'O que é Variação Anatômica?', back: 'Qualquer modificação da estrutura que não leva prejuízo às suas funções.', difficulty: 'easy' },
  { id: 9, module: 'Introdução à Anatomia', moduleColor: 'primary', front: 'Qual a diferença entre Anomalia e Monstruosidade?', back: 'Anomalia: alteração morfológica com transtorno funcional. Monstruosidade: anomalia muito acentuada, incompatível com a vida.', difficulty: 'medium' },
  { id: 10, module: 'Introdução à Anatomia', moduleColor: 'primary', front: 'Quais são os Fatores Gerais de Variação Anatômica?', back: 'Idade (recém-nascido: ~300 ossos, adulto: 206), Gênero (genitálias, deposição de gordura, proporções), Biótipo e Etnia.', difficulty: 'hard' },
  { id: 11, module: 'Introdução à Anatomia', moduleColor: 'primary', front: 'Descreva a Posição Anatômica de Descrição.', back: 'Corpo ereto, olhando para o horizonte, palmas das mãos voltadas para diante, pontas dos pés unidas.', difficulty: 'easy' },
  { id: 12, module: 'Introdução à Anatomia', moduleColor: 'primary', front: 'Quais são os 3 planos de secção do corpo?', back: 'Sagital (divide em direito/esquerdo), Frontal/Coronal (anterior/posterior), Horizontal/Transversal (superior/inferior).', difficulty: 'medium' },
  { id: 13, module: 'Introdução à Anatomia', moduleColor: 'primary', front: 'O que é o Plano Sagital Mediano?', back: 'Plano que divide o corpo em metades direita e esquerda iguais, passando pela linha média.', difficulty: 'easy' },
  { id: 14, module: 'Introdução à Anatomia', moduleColor: 'primary', front: 'O que é Decúbito Dorsal?', back: 'Posição em que o indivíduo está deitado com as costas apoiadas na superfície (barriga para cima).', difficulty: 'easy' },
  { id: 15, module: 'Introdução à Anatomia', moduleColor: 'primary', front: 'O que é a Posição de Trendelenburg?', back: 'Posição em decúbito dorsal com os pés elevados acima da cabeça, usada em cirurgias e emergências.', difficulty: 'hard' },
  { id: 16, module: 'Introdução à Anatomia', moduleColor: 'primary', front: 'O que é Flexão?', back: 'Curvatura ou diminuição do ângulo entre os ossos ou partes do corpo.', difficulty: 'easy' },
  { id: 17, module: 'Introdução à Anatomia', moduleColor: 'primary', front: 'O que é Extensão?', back: 'Endireitar ou aumentar o ângulo entre os ossos ou partes do corpo.', difficulty: 'easy' },
  { id: 18, module: 'Introdução à Anatomia', moduleColor: 'primary', front: 'Qual a diferença entre Adução e Abdução?', back: 'Adução: movimento em direção ao plano mediano. Abdução: movimento de afastamento do plano mediano.', difficulty: 'medium' },
  { id: 19, module: 'Introdução à Anatomia', moduleColor: 'primary', front: 'O que é Rotação Medial e Lateral?', back: 'Medial: traz a face anterior do membro para perto do plano mediano. Lateral: leva a face anterior para longe do plano mediano.', difficulty: 'medium' },
  { id: 20, module: 'Introdução à Anatomia', moduleColor: 'primary', front: 'O que é Pronação e Supinação?', back: 'Pronação: palmas voltadas para baixo (rotação medial do rádio). Supinação: palmas voltadas para cima (rotação lateral).', difficulty: 'medium' },
  { id: 21, module: 'Introdução à Anatomia', moduleColor: 'primary', front: 'O que é Protrusão/Protração?', back: 'Movimento dianteiro (para frente), como projetar a mandíbula para frente.', difficulty: 'medium' },
  { id: 22, module: 'Introdução à Anatomia', moduleColor: 'primary', front: 'O que é Posição de Litotomia?', back: 'Decúbito dorsal com quadris e joelhos fletidos e coxas abduzidas. Usada em exames ginecológicos.', difficulty: 'hard' },
  { id: 23, module: 'Introdução à Anatomia', moduleColor: 'primary', front: 'Cite as abreviaturas anatômicas: a., m., n., v.', back: 'a. = artéria, m. = músculo, n. = nervo, v. = veia. Plurais: aa., mm., nn., vv.', difficulty: 'easy' },
  { id: 24, module: 'Introdução à Anatomia', moduleColor: 'primary', front: 'O que é Anatomia Comparativa?', back: 'Estudo comparativo de órgãos de indivíduos de espécies diferentes (humano, gato, golfinho, morcego).', difficulty: 'medium' },
  { id: 25, module: 'Introdução à Anatomia', moduleColor: 'primary', front: 'O que é Anatomia Radiológica?', back: 'Estuda as formas do indivíduo vivo através do uso de raios-X e técnicas de imagem.', difficulty: 'easy' },

  // Módulo 2: Sistema Esquelético (25 cards)
  { id: 26, module: 'Sistema Esquelético', moduleColor: 'accent', front: 'O que é Osteologia?', back: 'Estudo dos ossos, que estão situados entre as partes moles do corpo, reunidos entre si por meio das articulações.', difficulty: 'easy' },
  { id: 27, module: 'Sistema Esquelético', moduleColor: 'accent', front: 'O que são ossos?', back: 'Estruturas esbranquiçadas, muito duras, que unindo-se aos outros por intermédio das articulações constituem o esqueleto.', difficulty: 'easy' },
  { id: 28, module: 'Sistema Esquelético', moduleColor: 'accent', front: 'O que é Cartilagem?', back: 'Forma elástica de tecido conectivo semirrígido que reveste superfícies articulares e forma estruturas como orelha e nariz.', difficulty: 'easy' },
  { id: 29, module: 'Sistema Esquelético', moduleColor: 'accent', front: 'Quais são as 6 funções do esqueleto?', back: 'Proteção, Sustentação, Sistema de Alavanca, Fixação dos Músculos, Armazenamento de Gordura e Minerais, Hematopoiética (produção de sangue).', difficulty: 'hard' },
  { id: 30, module: 'Sistema Esquelético', moduleColor: 'accent', front: 'Como a caixa torácica exerce sua função de proteção?', back: 'Protege órgãos vitais como o coração e os pulmões.', difficulty: 'easy' },
  { id: 31, module: 'Sistema Esquelético', moduleColor: 'accent', front: 'Qual órgão o crânio protege?', back: 'O cérebro (encéfalo), sendo uma das principais funções de proteção do esqueleto.', difficulty: 'easy' },
  { id: 32, module: 'Sistema Esquelético', moduleColor: 'accent', front: 'O que é a função Hematopoiética do esqueleto?', back: 'Produção de células sanguíneas (hemácias, plaquetas, leucócitos) pela medula óssea vermelha.', difficulty: 'medium' },
  { id: 33, module: 'Sistema Esquelético', moduleColor: 'accent', front: 'Qual a diferença entre medula óssea vermelha e amarela?', back: 'Vermelha: produz células sanguíneas (hematopoiese). Amarela: substitui a vermelha em alguns ossos, armazena gordura.', difficulty: 'medium' },
  { id: 34, module: 'Sistema Esquelético', moduleColor: 'accent', front: 'Quantos ossos tem o corpo humano adulto?', back: '206 ossos (baseado no homem adulto). O número varia conforme critérios de contagem e fatores etários.', difficulty: 'easy' },
  { id: 35, module: 'Sistema Esquelético', moduleColor: 'accent', front: 'Por que crianças têm mais ossos que adultos?', back: 'Porque os ossos ainda não estão fundidos. Um recém-nascido possui cerca de 300 ossos.', difficulty: 'medium' },
  { id: 36, module: 'Sistema Esquelético', moduleColor: 'accent', front: 'Qual a diferença entre Esqueleto Axial e Apendicular?', back: 'Axial: ossos no eixo central (crânio, coluna, caixa torácica). Apendicular: ossos dos membros e seus cíngulos.', difficulty: 'medium' },
  { id: 37, module: 'Sistema Esquelético', moduleColor: 'accent', front: 'O que são Ossos Longos?', back: 'Ossos onde o comprimento prevalece sobre a largura e espessura. Ex: Fêmur, Úmero, Tíbia, Fíbula.', difficulty: 'easy' },
  { id: 38, module: 'Sistema Esquelético', moduleColor: 'accent', front: 'O que são Ossos Curtos?', back: 'Ossos cujas três dimensões se equivalem. Ex: Ossos do Carpo e do Tarso.', difficulty: 'easy' },
  { id: 39, module: 'Sistema Esquelético', moduleColor: 'accent', front: 'O que são Ossos Planos (Laminares)?', back: 'Ossos onde largura e comprimento predominam sobre a espessura. Ex: Escápula, Esterno, Frontal, Ílio.', difficulty: 'easy' },
  { id: 40, module: 'Sistema Esquelético', moduleColor: 'accent', front: 'O que são Ossos Pneumáticos?', back: 'Ossos com cavidades internas revestidas por mucosa e preenchidas com ar, localizados na cabeça (seios paranasais). Ex: Frontal, Maxilar, Esfenoide.', difficulty: 'hard' },
  { id: 41, module: 'Sistema Esquelético', moduleColor: 'accent', front: 'O que são Ossos Sesamoides?', back: 'Ossos extranumerários encontrados nos tendões para melhor eficiência na mecânica ou alavanca muscular. Ex: Patela.', difficulty: 'medium' },
  { id: 42, module: 'Sistema Esquelético', moduleColor: 'accent', front: 'O que são Ossos Irregulares?', back: 'Ossos de formas variadas que não se enquadram nas classificações de longo, curto, plano, pneumático ou sesamoide. Ex: Vértebras, Mandíbula.', difficulty: 'medium' },
  { id: 43, module: 'Sistema Esquelético', moduleColor: 'accent', front: 'O que é um Forame?', back: 'Abertura circular ou ovalada no osso que permite a passagem de vasos e nervos. Ex: Forame Magno.', difficulty: 'medium' },
  { id: 44, module: 'Sistema Esquelético', moduleColor: 'accent', front: 'O que é uma Fossa em anatomia?', back: 'Depressão rasa na superfície de um osso. Ex: Fossa Poplítea, Fossa Subescapular.', difficulty: 'medium' },
  { id: 45, module: 'Sistema Esquelético', moduleColor: 'accent', front: 'O que é um Sulco ósseo?', back: 'Um "túnel sem teto" ao longo de uma superfície óssea que acomoda vasos, nervos ou tendões.', difficulty: 'medium' },
  { id: 46, module: 'Sistema Esquelético', moduleColor: 'accent', front: 'Quais são os ossos do Neurocrânio?', back: 'Frontal, Parietal (2), Temporal (2), Occipital, Esfenoide e Etmoide.', difficulty: 'hard' },
  { id: 47, module: 'Sistema Esquelético', moduleColor: 'accent', front: 'Quais ossos formam o Viscerocrânio?', back: 'Maxilar (2), Zigomático (2), Nasal (2), Lacrimal (2), Palatino (2), Vômer, Mandíbula, Concha nasal inferior (2).', difficulty: 'hard' },
  { id: 48, module: 'Sistema Esquelético', moduleColor: 'accent', front: 'O que é o Processo Xifoide?', back: 'Parte inferior do esterno, de formato pontiagudo, que serve como referência anatômica e ponto de inserção muscular.', difficulty: 'medium' },
  { id: 49, module: 'Sistema Esquelético', moduleColor: 'accent', front: 'Qual a diferença entre fratura exposta e fechada?', back: 'Exposta: o osso perfura a pele e fica visível. Fechada: o osso quebra sem romper a pele.', difficulty: 'easy' },
  { id: 50, module: 'Sistema Esquelético', moduleColor: 'accent', front: 'O que são Acidentes Ósseos?', back: 'Projeções, saliências, sulcos, orifícios e depressões na superfície dos ossos, derivados de linhas de tensão exercidas pelos músculos.', difficulty: 'medium' },

  // Módulo 3: Sistemas Orgânicos (25 cards)
  { id: 51, module: 'Sistemas Orgânicos', moduleColor: 'warning', front: 'Quais são os 11 sistemas do corpo humano?', back: 'Cardiovascular, Respiratório, Digestório, Nervoso, Endócrino, Excretor, Urinário, Esquelético, Muscular, Imunológico e Linfático.', difficulty: 'hard' },
  { id: 52, module: 'Sistemas Orgânicos', moduleColor: 'warning', front: 'Qual a função do Sistema Tegumentar?', back: 'Recobrimento externo do corpo, proteção dos tecidos profundos, síntese de vitamina D, aloja receptores cutâneos, glândulas sudoríferas e sebáceas.', difficulty: 'medium' },
  { id: 53, module: 'Sistemas Orgânicos', moduleColor: 'warning', front: 'Quais estruturas compõem o Sistema Tegumentar?', back: 'Pele, cabelo e unhas.', difficulty: 'easy' },
  { id: 54, module: 'Sistemas Orgânicos', moduleColor: 'warning', front: 'Qual a principal função do Sistema Muscular?', back: 'Permite locomoção, expressões faciais, inter-relação com o meio ambiente, manutenção da postura e produção de calor.', difficulty: 'medium' },
  { id: 55, module: 'Sistemas Orgânicos', moduleColor: 'warning', front: 'Qual a função do Sistema Nervoso?', back: 'Sistema de controle de ação rápida do corpo. Responde a alterações internas e externas, ativando músculos e glândulas.', difficulty: 'medium' },
  { id: 56, module: 'Sistemas Orgânicos', moduleColor: 'warning', front: 'Quais estruturas compõem o Sistema Nervoso Central?', back: 'Cérebro (encéfalo) e medula espinhal.', difficulty: 'easy' },
  { id: 57, module: 'Sistemas Orgânicos', moduleColor: 'warning', front: 'Qual a função do Sistema Endócrino?', back: 'Glândulas que secretam hormônios, regulando crescimento, reprodução e metabolismo.', difficulty: 'medium' },
  { id: 58, module: 'Sistemas Orgânicos', moduleColor: 'warning', front: 'Cite 5 glândulas do Sistema Endócrino.', back: 'Hipófise, Tireoide, Suprarrenais, Pâncreas, Pineal, Timo, Testículos/Ovários.', difficulty: 'hard' },
  { id: 59, module: 'Sistemas Orgânicos', moduleColor: 'warning', front: 'Qual a função do Sistema Cardiovascular?', back: 'O coração bombeia sangue pelos vasos sanguíneos, transportando oxigênio, CO₂, nutrientes e dejetos.', difficulty: 'medium' },
  { id: 60, module: 'Sistemas Orgânicos', moduleColor: 'warning', front: 'Qual a função do Sistema Linfático?', back: 'Capta fluido que escapa dos vasos sanguíneos, aloja linfócitos e monta resposta imunológica contra substâncias estranhas.', difficulty: 'medium' },
  { id: 61, module: 'Sistemas Orgânicos', moduleColor: 'warning', front: 'Quais órgãos compõem o Sistema Linfático?', back: 'Medula óssea, timo, vasos linfáticos, ducto torácico, baço e linfonodos.', difficulty: 'hard' },
  { id: 62, module: 'Sistemas Orgânicos', moduleColor: 'warning', front: 'Qual a função do Sistema Respiratório?', back: 'Manter o sangue constantemente abastecido de O₂ e remover CO₂. Trocas gasosas ocorrem nos alvéolos pulmonares.', difficulty: 'medium' },
  { id: 63, module: 'Sistemas Orgânicos', moduleColor: 'warning', front: 'Cite a via aérea em ordem.', back: 'Cavidade nasal → Faringe → Laringe → Traqueia → Brônquios → Bronquíolos → Alvéolos.', difficulty: 'hard' },
  { id: 64, module: 'Sistemas Orgânicos', moduleColor: 'warning', front: 'Qual a função do Sistema Digestório?', back: 'Decompor alimentos em unidades absorvíveis para a corrente sanguínea e eliminar resíduos não digeridos como fezes.', difficulty: 'medium' },
  { id: 65, module: 'Sistemas Orgânicos', moduleColor: 'warning', front: 'Cite os órgãos do tubo digestório em ordem.', back: 'Cavidade oral → Esôfago → Estômago → Intestino delgado → Intestino grosso → Reto → Ânus.', difficulty: 'hard' },
  { id: 66, module: 'Sistemas Orgânicos', moduleColor: 'warning', front: 'Qual a função do Sistema Urinário?', back: 'Eliminar dejetos nitrogenados, regular água, eletrólitos e equilíbrio ácido-base do sangue.', difficulty: 'medium' },
  { id: 67, module: 'Sistemas Orgânicos', moduleColor: 'warning', front: 'Quais estruturas compõem o Sistema Urinário?', back: 'Rins, Ureteres, Bexiga e Uretra.', difficulty: 'easy' },
  { id: 68, module: 'Sistemas Orgânicos', moduleColor: 'warning', front: 'Qual a função do Sistema Genital Masculino?', back: 'Produção de descendentes. Os testículos produzem espermatozoides e hormônio sexual masculino (testosterona).', difficulty: 'medium' },
  { id: 69, module: 'Sistemas Orgânicos', moduleColor: 'warning', front: 'Quais estruturas compõem o Sistema Reprodutor Feminino?', back: 'Ovários, Tubas uterinas, Útero, Vagina e Mamas (glândulas mamárias).', difficulty: 'medium' },
  { id: 70, module: 'Sistemas Orgânicos', moduleColor: 'warning', front: 'O que é o Mediastino?', back: 'Região central do tórax entre os pulmões, dividida em superior e inferior (anterior, médio e posterior).', difficulty: 'hard' },
  { id: 71, module: 'Sistemas Orgânicos', moduleColor: 'warning', front: 'Onde ocorrem as trocas gasosas no pulmão?', back: 'Nos alvéolos pulmonares, através de suas finas paredes (sacos de ar).', difficulty: 'easy' },
  { id: 72, module: 'Sistemas Orgânicos', moduleColor: 'warning', front: 'Qual o papel do fígado no sistema digestório?', back: 'Produz bile para emulsificar gorduras, metaboliza nutrientes, desintoxica substâncias e armazena glicogênio.', difficulty: 'hard' },
  { id: 73, module: 'Sistemas Orgânicos', moduleColor: 'warning', front: 'Qual a diferença entre Nervos Espinhais e Cranianos?', back: 'Espinhais: saem da medula espinhal (31 pares). Cranianos: saem do encéfalo (12 pares).', difficulty: 'hard' },
  { id: 74, module: 'Sistemas Orgânicos', moduleColor: 'warning', front: 'Qual a função das glândulas mamárias?', back: 'Produzem leite para alimentar o recém-nascido, sendo parte do sistema reprodutor feminino.', difficulty: 'easy' },
  { id: 75, module: 'Sistemas Orgânicos', moduleColor: 'warning', front: 'O que é a Síndrome do Túnel do Carpo?', back: 'Compressão do nervo mediano ao passar pelo túnel do carpo no punho, causando dor, formigamento e fraqueza na mão.', difficulty: 'medium' },

  // Módulo 4: Biomedicina Clínica (25 cards)
  { id: 76, module: 'Biomedicina Clínica', moduleColor: 'destructive', front: 'O que é Eritropoetina?', back: 'Hormônio produzido nos rins que estimula a produção de hemácias pela medula óssea.', difficulty: 'medium' },
  { id: 77, module: 'Biomedicina Clínica', moduleColor: 'destructive', front: 'O que é Desvio à Esquerda no hemograma?', back: 'Presença de precursores imaturos de neutrófilos (bastonetes) no sangue, indicando infecção ou inflamação aguda.', difficulty: 'hard' },
  { id: 78, module: 'Biomedicina Clínica', moduleColor: 'destructive', front: 'Qual a mutação da Anemia Falciforme?', back: 'Substituição do ácido glutâmico pela valina na posição 6 da cadeia beta da globina.', difficulty: 'hard' },
  { id: 79, module: 'Biomedicina Clínica', moduleColor: 'destructive', front: 'O que é o VCM (Volume Corpuscular Médio)?', back: 'Indica o tamanho médio das hemácias: Normocítica (normal), Microcítica (pequena) ou Macrocítica (grande).', difficulty: 'medium' },
  { id: 80, module: 'Biomedicina Clínica', moduleColor: 'destructive', front: 'O que são Reticulócitos?', back: 'Hemácias jovens que indicam a capacidade regenerativa da medula óssea.', difficulty: 'medium' },
  { id: 81, module: 'Biomedicina Clínica', moduleColor: 'destructive', front: 'O que diferencia bactérias Gram+ de Gram-?', back: 'Gram+ retêm cristal violeta (espessa camada de peptideoglicano = roxo). Gram- não retêm (fina camada = rosa).', difficulty: 'medium' },
  { id: 82, module: 'Biomedicina Clínica', moduleColor: 'destructive', front: 'O que indica IgM elevada?', back: 'Primeira imunoglobulina produzida na resposta imune primária; indica infecção aguda.', difficulty: 'medium' },
  { id: 83, module: 'Biomedicina Clínica', moduleColor: 'destructive', front: 'O que é a Cápsula Bacteriana?', back: 'Estrutura externa que confere resistência à fagocitose, fator de virulência importante.', difficulty: 'medium' },
  { id: 84, module: 'Biomedicina Clínica', moduleColor: 'destructive', front: 'O que é MHC Classe I?', back: 'Complexo Maior de Histocompatibilidade que apresenta antígenos endógenos para linfócitos T CD8+ (citotóxicos).', difficulty: 'hard' },
  { id: 85, module: 'Biomedicina Clínica', moduleColor: 'destructive', front: 'O que é Hipersensibilidade Tipo I?', back: 'Reação imediata mediada por IgE. Exemplo: choque anafilático, rinite alérgica.', difficulty: 'hard' },
  { id: 86, module: 'Biomedicina Clínica', moduleColor: 'destructive', front: 'O que a Hemoglobina Glicada (HbA1c) reflete?', back: 'A glicemia média dos últimos 90 a 120 dias, usada no monitoramento do diabetes.', difficulty: 'medium' },
  { id: 87, module: 'Biomedicina Clínica', moduleColor: 'destructive', front: 'O que a Creatinina avalia?', back: 'Produto da degradação da fosfocreatina, usado para avaliar a taxa de filtração glomerular (função renal).', difficulty: 'medium' },
  { id: 88, module: 'Biomedicina Clínica', moduleColor: 'destructive', front: 'O que é Bilirrubina Indireta?', back: 'Forma não conjugada, lipossolúvel, transportada pela albumina no sangue. Elevação indica hemólise ou disfunção hepática.', difficulty: 'hard' },
  { id: 89, module: 'Biomedicina Clínica', moduleColor: 'destructive', front: 'Qual a diferença entre HDL e LDL?', back: 'HDL transporta colesterol dos tecidos para o fígado (bom). LDL faz o inverso, depositando nas artérias (ruim).', difficulty: 'medium' },
  { id: 90, module: 'Biomedicina Clínica', moduleColor: 'destructive', front: 'O que é Troponina I/T?', back: 'Marcadores de escolha para diagnóstico de infarto agudo do miocárdio (IAM). Altamente específicos para lesão cardíaca.', difficulty: 'medium' },
  { id: 91, module: 'Biomedicina Clínica', moduleColor: 'destructive', front: 'O que são Células de Reed-Sternberg?', back: 'Células gigantes multinucleadas patognomônicas do Linfoma de Hodgkin.', difficulty: 'hard' },
  { id: 92, module: 'Biomedicina Clínica', moduleColor: 'destructive', front: 'O que é Metaplasia?', back: 'Mudança reversível de um tipo celular adulto por outro da mesma linhagem germinativa.', difficulty: 'medium' },
  { id: 93, module: 'Biomedicina Clínica', moduleColor: 'destructive', front: 'O que é Apoptose?', back: 'Morte celular programada, sem resposta inflamatória, regulada geneticamente.', difficulty: 'easy' },
  { id: 94, module: 'Biomedicina Clínica', moduleColor: 'destructive', front: 'Para que serve a Coloração de Papanicolaou?', back: 'Técnica padrão para rastreio de câncer do colo do útero (exame preventivo).', difficulty: 'easy' },
  { id: 95, module: 'Biomedicina Clínica', moduleColor: 'destructive', front: 'O que é PCR (Reação em Cadeia da Polimerase)?', back: 'Técnica para amplificar sequências específicas de DNA in vitro usando DNA polimerase termoestável.', difficulty: 'medium' },
  { id: 96, module: 'Biomedicina Clínica', moduleColor: 'destructive', front: 'O que indica o cariótipo 47, XXY?', back: 'Síndrome de Klinefelter - homem com cromossomo X extra, causando hipogonadismo e infertilidade.', difficulty: 'hard' },
  { id: 97, module: 'Biomedicina Clínica', moduleColor: 'destructive', front: 'O que é Transcrição?', back: 'Processo de síntese de RNA mensageiro (mRNA) a partir de um molde de DNA, realizado pela RNA polimerase.', difficulty: 'easy' },
  { id: 98, module: 'Biomedicina Clínica', moduleColor: 'destructive', front: 'Qual a diferença entre Éxons e Íntrons?', back: 'Éxons: sequências codificantes que permanecem no mRNA maduro. Íntrons: sequências não codificantes removidas no splicing.', difficulty: 'medium' },
  { id: 99, module: 'Biomedicina Clínica', moduleColor: 'destructive', front: 'Quantas ligações de hidrogênio unem C-G?', back: '3 ligações de hidrogênio (mais forte que A-T com 2 ligações).', difficulty: 'easy' },
  { id: 100, module: 'Biomedicina Clínica', moduleColor: 'destructive', front: 'O que é Atrofia?', back: 'Redução do tamanho da célula por perda de substância celular, podendo ser fisiológica ou patológica.', difficulty: 'easy' },
];

export function getQuizQuestions(count: number = 10, moduleFilter?: string) {
  let pool = [...flashcards];
  if (moduleFilter) {
    pool = pool.filter(c => c.module === moduleFilter);
  }
  const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, count);
  
  return shuffled.map(card => {
    const wrongAnswers = flashcards
      .filter(c => c.id !== card.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(c => c.back);
    
    const options = [...wrongAnswers, card.back].sort(() => Math.random() - 0.5);
    const correctIndex = options.indexOf(card.back);
    
    return {
      id: card.id,
      question: card.front,
      options,
      correctIndex,
      module: card.module,
      difficulty: card.difficulty,
    };
  });
}
