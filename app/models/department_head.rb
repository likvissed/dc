class DepartmentHead < ActiveRecord::Base

  resourcify

  has_many :contacts

  validates :tn, :dept, presence: true, numericality: { greater_than: 0 }, uniqueness: true

end
