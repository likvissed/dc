class Contact < ActiveRecord::Base

  resourcify

  has_many :first_contacts, class_name: "Service", foreign_key: :contact_1_id
  has_many :second_contacts, class_name: "Service", foreign_key: :contact_2_id

  validates :tn, :info, presence: true
  validates :tn, numericality: { greater_than: 0 }

end
