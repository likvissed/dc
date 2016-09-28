class DepartmentHead < ActiveRecord::Base

  after_validation :get_user_iss_data, on: [:create, :update], if: :necessary_condition
  after_validation :check_dept, on: :create
  after_create :set_department_head, if: :necessary_condition

  resourcify

  has_many :contacts, dependent: :nullify

  strip_attributes allow_empty: true, collapse_spaces: true

  validates :tn, presence: true, numericality: { greater_than: 0 }, uniqueness: true

  private

  # Проверка на наличие ошибок после выполнения валидации
  def necessary_condition
    !self.errors.any?
  end

  # Проверить, существует ли уже начальник отдела в базе до того, перед тем как создать нового руководителя
  def check_dept
    @department_heads = DepartmentHead.all
    self.errors.add(:base, "Руководитель отдела \"#{self.dept}\" уже существует. Удалите существующего руководителя и повторите действия, либо отредактируйте запись, связанную с существующим руководителем") if @department_heads.where(dept: self.dept).any?
  end

  # Получить данные о руководителе из базы Netadmin
  def get_user_iss_data
    @user = UserIss.find_by(tn: self.tn)
    if @user.nil?
      self.errors.add(:tn, "Информация по указанному табельному не найдена")
      return
    end

    self.info = @user.fio
    self.dept = @user.dept

    # check_dept
    self.errors.add(:base, "Номер отдела не может пройти проверку (неверный тип данных). Обратитесь к администртору") unless self.dept.to_s =~ /\d+/
  end

  # Создание внешнего ключа на руководителя для всех существующих контактов
  def set_department_head
    Contact.where(dept: self.dept).update_all(department_head_id: self.id)
  end

end
