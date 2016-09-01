class Service < ActiveRecord::Base

  before_save :check_exploitation

  resourcify

  has_many :service_networks, dependent: :destroy
  has_many :storage_systems, dependent: :destroy

  has_many :service_dep_parents, foreign_key: :child_id, class_name: "ServiceDependency", dependent: :destroy
  has_many :parents, through: :service_dep_parents, source: :parent_service

  has_many :service_dep_childs, foreign_key: :parent_id, class_name: "ServiceDependency", dependent: :restrict_with_error
  has_many :childs, through: :service_dep_childs, source: :child_service

  belongs_to :contact_1, class_name: "Contact"
  belongs_to :contact_2, class_name: "Contact"


  validates :name, presence: true, uniqueness: true

  strip_attributes allow_empty: true, collapse_spaces: true

  accepts_nested_attributes_for :service_networks, allow_destroy: true, reject_if: proc { |attr| attr["segment"].blank? || attr["vlan"].blank? || attr["dns_name"].blank? }
  accepts_nested_attributes_for :storage_systems, allow_destroy: true, reject_if: proc { |attr| attr["name"].blank? }
  accepts_nested_attributes_for :service_dep_parents, allow_destroy: true, reject_if: proc { |attr| attr["parent_id"].blank? }

  enum priority:  ["Критическая производственная задача", "Вторичная производственная задача", "Тестирование и отладка"]
  enum time_work: ["Круглосуточно (24/7)", "Рабочее время (8/5)", "По запросу"]

  has_attached_file :scan
  has_attached_file :act
  has_attached_file :instr_rec
  has_attached_file :instr_off

  validates_attachment_content_type :scan, content_type: [
    "application/pdf",
    "image/jpg",
    "image/jpeg",
    "image/png"
    # "application/force-download",
    # "application/x-file-download"
  ]
  validates_attachment_content_type :act, content_type: [
    "application/pdf",
    "application/msword",
    "image/jpg",
    "image/jpeg",
    "image/png",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    # "application/force-download",
    # "application/x-file-download"
  ]
  validates_attachment_content_type :instr_rec, content_type: [
    "application/pdf",
    "application/msword",
    "image/jpg",
    "image/jpeg",
    "image/png",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    # "application/force-download",
    # "application/x-file-download"
  ]
  validates_attachment_content_type :instr_off, content_type: [
    "application/pdf",
    "application/msword",
    "image/jpg",
    "image/jpeg",
    "image/png",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    # "application/force-download",
    # "application/x-file-download"
  ]

  private

  # Установить false, если флаг эксплуатации не установлен
  def check_exploitation
    self.exploitation = 'false' if exploitation.nil?
  end

end