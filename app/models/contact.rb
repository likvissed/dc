class Contact < ActiveRecord::Base

  resourcify

  has_many :first_contacts, class_name: "Service", foreign_key: :contact_1_id, dependent: :restrict_with_error
  has_many :second_contacts, class_name: "Service", foreign_key: :contact_2_id, dependent: :restrict_with_error

  belongs_to :department_head

  validates :tn, :info, presence: true
  validates :tn, numericality: { greater_than: 0 }, uniqueness: true

end
