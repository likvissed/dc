class Cluster < ActiveRecord::Base

  resourcify

  has_many :cluster_details, dependent: :destroy
  has_many :servers, through: :cluster_details
  has_many :node_roles, through: :cluster_details

  has_many :service_hostings, dependent: :restrict_with_error
  has_many :services, through: :service_hostings

  accepts_nested_attributes_for :cluster_details, allow_destroy: true, reject_if: proc { |attr| attr["server_id"].blank? || attr["node_role_id"].blank? }

  # Empty attributes will not be converted to nil
  # Sequential spaces in attributes will be collapsed to one space
  strip_attributes allow_empty: true, collapse_spaces: true

  validates :name, uniqueness: { case_sensitive: false }, presence: true

  # Получить список оборудования с указанным статусом.
  def self.where_status_is(status)
    all.reject { |s| s.get_status != Service::STATUSES[status.to_sym] }
  end

  # Получить статус сервера. Статус зависит от сервисов, работающих на сервере.
  # Возможные варианты:
  # 1. Если есть хотя бы один критичный/вторичный сервис - статус "В работе" (level 1)
  # 2. Если все сервисы, связанные с оборудованием, тестовые - статус "Тест" (level 2)
  # 3. Если нет ни одного сервиса - статус "Простой" (level 3)
  def get_status
    level = 3

    services.each do |s|
      if ["Критическая производственная задача", "Вторичная производственная задача"].include? s.priority
        level = 1
        break
      end

      level = 2 if s.priority == "Тестирование и отладка"
    end

    case level
      when 1
        Service::STATUSES[:work]
      when 2
        Service::STATUSES[:test]
      when 3
        Service::STATUSES[:inactive]
      else
        "Не определен"
    end
  end
end
