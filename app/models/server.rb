class Server < ActiveRecord::Base

  resourcify

  before_update :check_real_server_details

  has_many :cluster_details, dependent: :restrict_with_error
  has_many :clusters, through: :cluster_details

  has_many :real_server_details, dependent: :destroy
  has_many :server_parts, through: :real_server_details

  belongs_to :server_type

  accepts_nested_attributes_for :real_server_details, allow_destroy: true, reject_if: proc { |attr|
    attr["server_part_id"].blank? }

  strip_attributes allow_empty: true, collapse_spaces: true

  validates :inventory_num, :server_type_id, presence: true
  validates :inventory_num, uniqueness: { case_sensitive: false }
  validates :server_type_id, numericality: { greater_than: 0 }

  # Получить список серверов с указанным статусом.
  def self.where_status_is(status)
    all.reject { |s| s.get_status != Service::STATUSES[status.to_sym] }
  end

  # Получить статус оборудования. Статус зависит от сервисов, работающих на сервере, которые в свою очередь связаны с
  # выбранным оборудованием.
  # Возможные варианты:
  # 1. Если есть хотя бы один критичный/вторичный сервис - статус "В работе" (level 1)
  # 2. Если все сервисы, связанные с оборудованием, тестовые - статус "Тест" (level 2)
  # 3. Если нет ни одного сервиса - статус "Простой" (level 3)
  def get_status
    level = 3

    clusters.each do |c|
      c.services.each do |s|
        if ['Критическая производственная задача', 'Вторичная производственная задача', 'Отладка'].include? s.priority
          level = 1
          break
        end

        level = 2 if s.priority == 'Внедрение'
      end
      break if level == 1
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

  # Получить расположение оборудования в виде "Корпус 27, стойка 4, место 9"
  def get_location
    arr = []

    arr.push("Корпус #{loc_area}") unless loc_area.empty?
    arr.push("Стойка #{loc_stand}") unless loc_stand.empty?
    arr.push("Место #{loc_place}") unless loc_place.empty?

    arr.join(', ')
  end

  private

  # Проверка, был ли изменен тип оборудования.
  # Если да, удалить все старые записи о комплектующей оборудования.
  def check_real_server_details
    @old_data = Server.find(self.id)
    unless self.server_type_id == @old_data.server_type_id
      @old_data.real_server_details.destroy_all
    end
  end

end
