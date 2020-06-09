class DepartmentHead < ActiveRecord::Base

  after_validation :get_user_iss_data, on: [:create, :update], if: :necessary_condition
  after_validation :check_dept, on: :create
  after_create :set_department_head, if: :necessary_condition

  resourcify

  has_many :contacts, dependent: :nullify

  validates :tn, presence: true, numericality: { greater_than: 0 }, uniqueness: true

  strip_attributes allow_empty: true, collapse_spaces: true

  private

  # Проверка на наличие ошибок после выполнения валидации
  def necessary_condition
    !self.errors.any?
  end

  # Получить данные о руководителе из базы Netadmin
  def get_user_iss_data
    @user = UsersReference.user_find_by_tn(self.tn)

    if @user.blank?
      self.errors.add(:base, "Информация по указанному табельному не найдена. Проверьте правильность введенного табельного номера и повторите попытку")
      return
    end

    self.info = @user['fullName']
    self.dept = @user['departmentForAccounting']

    self.errors.add(:base, "Номер отдела не может пройти проверку (неверный тип данных). Обратитесь к администртору") unless self.dept.to_s =~ /\d+/
  end

  # Проверить, существует ли уже начальник отдела в базе до того, перед тем как создать нового руководителя
  def check_dept
    @department_heads = DepartmentHead.all
    self.errors.add(:base, "Руководитель отдела \"#{self.dept}\" уже существует. Удалите существующего руководителя и повторите действия, либо отредактируйте запись, связанную с существующим руководителем") if @department_heads.where(dept: self.dept).any?
  end

  # Создание внешнего ключа на руководителя для всех существующих контактов
  def set_department_head
    Contact.where(dept: self.dept).update_all(department_head_id: self.id)
  end

end
