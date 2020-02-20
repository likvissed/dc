class ServiceNetwork < ActiveRecord::Base
  require 'resolv'

  after_validation :get_ip

  resourcify

  has_one :service_port, dependent: :destroy

  belongs_to :service

  validates :segment, :vlan, :dns_name, presence: true
  validates :vlan, numericality: { only_integer: true }

  strip_attributes allow_empty: true, collapse_spaces: true

  accepts_nested_attributes_for :service_port, allow_destroy: true

  private

  # Получить IP-адрес хоста, указанного в подключениях к сети
  def get_ip
    @resolve = Resolv::DNS.new(nameserver: ['10.0.0.3', '10.0.0.6'], search: ['npopm.ru'])
    begin
      self.ip = if self.dns_name.empty?
                  nil
                else
                  @resolve.getaddress(self.dns_name).to_s
                end
    rescue
      self.ip = nil
    end
    @resolve.close()
  end

end
