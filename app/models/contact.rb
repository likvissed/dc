class Contact < ActiveRecord::Base

  after_validation :get_user_iss_data, on: [:create, :update], if: :necessary_condition
  before_save :set_department_head

  resourcify

  has_many :first_contacts, class_name: "Service", foreign_key: :contact_1_id, dependent: :restrict_with_error
  has_many :second_contacts, class_name: "Service", foreign_key: :contact_2_id, dependent: :restrict_with_error

  belongs_to :department_head

  strip_attributes allow_empty: true, collapse_spaces: true

  validates :tn, presence: true, numericality: { greater_than: 0 }, uniqueness: true
  # presence { message: "Табельный номер не может быть пустым" }
  # presence: { message: "\"Фамилия Имя Отчество\" не может быть пустым" }
  validates :info, presence: true, if: Proc.new { |obj| obj.manually }
  validates :dept, numericality: true, if: Proc.new { |obj| obj.manually }

  private

  # Проверка на наличие ошибок после выполнения валидаций,
  # а также, установлен ли флаг "Заполнить данные контакта вручную"
  def necessary_condition
    !(self.errors.any? || self.manually)
  end

  # Получение данных из базы Netadmin
  def get_user_iss_data
    @user = UserIss.find_by(tn: self.tn)
    if @user.nil?
      self.errors.add(:tn, "Информация по указанному табельному не найдена")
      return
    end

    self.info     = @user.fio
    self.dept     = @user.dept
    self.work_num = @user.tel
  end

  # Создание внешнего ключа на руководителя (если руководитель существует)
  def set_department_head
    @department_head = DepartmentHead.find_by(dept: self.dept)
    unless @department_head.nil?
      self.department_head = @department_head
    end
  end

end
