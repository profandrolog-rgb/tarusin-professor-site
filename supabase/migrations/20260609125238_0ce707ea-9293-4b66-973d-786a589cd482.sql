
UPDATE public.disease_articles
SET article_content = replace(
  replace(
    replace(
      article_content,
      '[[GALLERY: caption="Клиническая картина гинекомастии"]]',
      '[[GALLERY: caption="Клиническая картина гинекомастии"|ginekomastiya-patient-1.jpg|ginekomastiya-patient-2.jpg|ginekomastiya-patient-3.jpg|ginekomastiya-patient-4.jpg|ginekomastiya-patient-5.jpg|ginekomastiya-patient-6.jpg|ginekomastiya-patient-7.jpg|ginekomastiya-patient-8.jpg|ginekomastiya-patient-9.jpg|ginekomastiya-patient-10.jpg|ginekomastiya-patient-11.jpg|ginekomastiya-patient-12.jpg]]'
    ),
    '[[GALLERY: caption="Эпидемиология гинекомастии"]]',
    '[[GALLERY: caption="Эпидемиология гинекомастии"|ginekomastiya-infographic-1.jpg]]'
  ),
  '[[GALLERY: caption="Гинекомастия и другие гормональные агенты"]]',
  '[[GALLERY: caption="Гинекомастия и другие гормональные агенты"|ginekomastiya-infographic-2.jpg]]'
)
WHERE slug = 'ginekomastiya';
