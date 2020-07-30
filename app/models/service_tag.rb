class ServiceTag < ActiveRecord::Base
  belongs_to :service
  belongs_to :tag

  validates :tag_id, presence: true
end
