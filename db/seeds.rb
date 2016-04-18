DetailType.destroy_all
ServerPart.destroy_all

DetailType.create( [
  { name: "Диск" },
  { name: "Память" },
  { name: "Питание" },
  { name: "Оптический линк" }
] )

#detail_type = DetailType.find_by(name: "Диск")
#ServerPart.create()
