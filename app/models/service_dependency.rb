class ServiceDependency < ActiveRecord::Base

  belongs_to :child, foreign_key: :child_id, class_name: "Service"
  belongs_to :parent, foreign_key: :parent_id, class_name: "Service"

end
