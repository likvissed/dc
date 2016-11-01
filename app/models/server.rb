class Server < ActiveRecord::Base

  resourcify

  before_update :check_real_server_details

  has_many :cluster_details, dependent: :restrict_with_error
  has_many :clusters, through: :cluster_details

  has_many :real_server_details, dependent: :destroy
  has_many :server_parts, through: :real_server_details

  belongs_to :server_type

  accepts_nested_attributes_for :real_server_details, allow_destroy: true, reject_if: proc { |attr| attr["server_part_id"].blank? }

  strip_attributes allow_empty: true, collapse_spaces: true

  validates :name, :server_type_id, :status, presence: true
  validates :name, uniqueness: { case_sensitive: false }

  enum status:  ["В работе", "Тест", "Простой"]

  private

  # Проверка, был ли изменен тип сервера.
  # Если да, удалить все старые записи о комплектующей сервера.
  def check_real_server_details
    @old_data = Server.find(self.id)
    unless self.server_type_id == @old_data.server_type_id
      @old_data.real_server_details.destroy_all
    end
  end

end
