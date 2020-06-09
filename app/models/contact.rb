class Contact < ActiveRecord::Base

  after_validation :get_user_iss_data, on: [:create, :update], if: :necessary_condition
  before_save :set_department_head

  resourcify

  has_many :first_contacts, class_name: "Service", foreign_key: :contact_1_id, dependent: :restrict_with_error
  has_many :second_contacts, class_name: "Service", foreign_key: :contact_2_id, dependent: :restrict_with_error

  belongs_to :department_head

  validates :tn, presence: true, numericality: { greater_than: 0 }, uniqueness: true
  validates :info, presence: true, if: Proc.new { |obj| obj.manually }
  validates :dept, presence: true, numericality: true, if: Proc.new { |obj| obj.manually }

  strip_attributes allow_empty: true, collapse_spaces: true

  private

  # Проверка на наличие ошибок после выполнения валидаций,
  # а также, установлен ли флаг "Заполнить данные контакта вручную"
  def necessary_condition
    !(self.errors.any? || self.manually)
  end

  # Получение данных из базы Netadmin
  def get_user_iss_data
    @user = UsersReference.user_find_by_tn(self.tn)

    if @user.blank?
      self.errors.add(:tn, "Информация по указанному табельному не найдена")
      return
    end

    self.info     = @user['fullName']
    self.dept     = @user['departmentForAccounting']
    self.work_num = @user['phone'].first if @user['phone'].present?
    self.mobile_num = @user['mobilePhone'].first if @user['mobilePhone'].present?
  end

  # Создание внешнего ключа на руководителя (если руководитель существует)
  def set_department_head
    @department_head = DepartmentHead.find_by(dept: self.dept)
    unless @department_head.nil?
      self.department_head = @department_head
    end
  end

end
