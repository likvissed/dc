class ServiceDependency < ActiveRecord::Base

  resourcify

  belongs_to :child_service, foreign_key: :child_id, class_name: "Service"
  belongs_to :parent_service, foreign_key: :parent_id, class_name: "Service"

  validates :parent_id, presence: true, numericality: { greater_than: 0 }
  validate  :reject_self_references

  private

  # Запретить ссылаться на себя
  def reject_self_references
    errors.add(:parent_id, "Нельзя ссылаться на себя") if self.child_id == self.parent_id
  end

end
