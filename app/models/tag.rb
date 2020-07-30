class Tag < ActiveRecord::Base
  has_many :service_tags, dependent: :destroy
  has_many :services, through: :service_tags

  validates :name, presence: true, uniqueness: true
end
