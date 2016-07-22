class Service < ActiveRecord::Base

  resourcify

  belongs_to :contact_1, class_name: "Contact"
  belongs_to :contact_2, class_name: "Contact"

  validates :name, presence: true

  enum priority:      ["Критическая производственная задача", "Вторичная производственная задача", "Тестирование и отладка"]
  enum time_working:  ["Круглосуточно (24/7)", "Рабочее время (8/5)", "По запросу"]

end
