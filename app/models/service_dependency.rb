class ServiceDependency < ActiveRecord::Base

  resourcify

  belongs_to :child_service, foreign_key: :child_id, class_name: "Service"
  belongs_to :parent_service, foreign_key: :parent_id, class_name: "Service"

  validates :parent_id, presence: true, numericality: { greater_than: 0 }

end
